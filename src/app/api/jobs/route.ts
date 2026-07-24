import { NextResponse } from 'next/server';

interface RawArbeitsagenturJob {
  refnr?: string;
  titel?: string;
  beruf?: string;
  arbeitgeber?: string;
  arbeitsort?: {
    plz?: string;
    ort?: string;
    strasse?: string;
    region?: string;
    land?: string;
    koordinaten?: {
      lat?: number;
      lon?: number;
    };
    entfernung?: string;
  };
  arbeitszeit?: string;
  externeUrl?: string;
  aktuelleVeroeffentlichungsdatum?: string;
  eintrittsdatum?: string;
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Fallback mock job generator in case real API call fails or is out of region
function generateFallbackJobs(lat: number, lon: number, radiusKm: number, count: number = 20) {
  const JOB_TITLES = ["Software Engineer", "Mechatroniker", "Marketing Manager", "Projektleiter", "Data Analyst", "Buchhalter", "Pflegefachkraft", "Verkäufer", "Elektroniker"];
  const COMPANY_NAMES = ["SIEMENS", "Deutsche Bahn", "Lufthansa", "Allianz", "BMW", "SAP", "Bosch", "Telekom", "Aldi", "Edeka"];

  const jobs = [];
  for (let i = 0; i < count; i++) {
    const radiusInDegrees = radiusKm / 111.12;
    const randomRadius = Math.random() * radiusInDegrees;
    const randomAngle = Math.random() * 2 * Math.PI;
    const jobLat = lat + randomRadius * Math.cos(randomAngle);
    const jobLon = lon + randomRadius * Math.sin(randomAngle);

    const distance = calculateDistanceKm(lat, lon, jobLat, jobLon);

    jobs.push({
      id: `fallback-${i}`,
      title: JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)],
      company_name: COMPANY_NAMES[Math.floor(Math.random() * COMPANY_NAMES.length)],
      location_name: "In der Nähe",
      latitude: jobLat,
      longitude: jobLon,
      distance: Math.round(distance * 10) / 10,
      type: Math.random() > 0.3 ? "Vollzeit" : "Teilzeit",
      salary_min: Math.floor(Math.random() * 20 + 30) + ".000 €",
      salary_max: Math.floor(Math.random() * 30 + 50) + ".000 €",
      redirect_url: "https://www.arbeitsagentur.de/jobsuche/",
      published_date: new Date().toISOString().split('T')[0],
      routes: {
        driving: Math.max(1, Math.round((distance / 50) * 60)) + " Min",
        cycling: Math.max(1, Math.round((distance / 15) * 60)) + " Min",
        walking: Math.max(1, Math.round((distance / 5) * 60)) + " Min"
      }
    });
  }
  return jobs.sort((a, b) => a.distance - b.distance);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '50.1109');
  const lon = parseFloat(searchParams.get('lon') || '8.6821');
  const radius = parseFloat(searchParams.get('radius') || '25');
  const query = searchParams.get('query') || searchParams.get('was') || '';
  const jobType = searchParams.get('jobType') || '';

  try {
    // 1. Reverse geocode user location to get city or postcode for Arbeitsagentur API
    let locationTerm = '60311';
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
      const geoRes = await fetch(geoUrl, {
        headers: { 'User-Agent': 'JobMaps/1.0 (https://jobmaps.local)' },
        next: { revalidate: 3600 }
      });
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        locationTerm =
          geoData.address?.postcode ||
          geoData.address?.city ||
          geoData.address?.town ||
          geoData.address?.village ||
          '60311';
      }
    } catch (e) {
      console.warn('Geocoding error, falling back to default postcode:', e);
    }

    // 2. Fetch real jobs from Arbeitsagentur Jobsuche API (size=100 for wider regional coverage)
    let baUrl = `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?wo=${encodeURIComponent(locationTerm)}&umkreis=${Math.min(200, Math.max(1, Math.round(radius)))}&size=100`;
    if (query) {
      baUrl += `&was=${encodeURIComponent(query)}`;
    }

    const baRes = await fetch(baUrl, {
      headers: {
        'X-API-Key': 'jobboerse-jobsuche',
        'User-Agent': 'JobMaps/1.0 (https://jobmaps.local)'
      },
      next: { revalidate: 300 }
    });

    if (baRes.ok) {
      const baData = await baRes.json();
      const rawJobs: RawArbeitsagenturJob[] = baData.stellenangebote || [];

      if (rawJobs.length > 0) {
        const jobs = rawJobs.map((item, idx) => {
          let jobLat = item.arbeitsort?.koordinaten?.lat;
          let jobLon = item.arbeitsort?.koordinaten?.lon;

          // If coordinates are missing, place within radius of user location
          if (!jobLat || !jobLon) {
            const radiusInDegrees = (radius / 3) / 111.12;
            const angle = Math.random() * 2 * Math.PI;
            const r = Math.random() * radiusInDegrees;
            jobLat = lat + r * Math.cos(angle);
            jobLon = lon + r * Math.sin(angle);
          } else {
            // Apply slight radial dispersion so overlapping company jobs spread out nicely
            const angle = (idx * 0.8) + (Math.random() * 0.4);
            const r = 0.0003 + (idx % 4) * 0.0002; // ~30m to 80m spread
            jobLat += r * Math.cos(angle);
            jobLon += r * Math.sin(angle);
          }

          const exactDist = calculateDistanceKm(lat, lon, jobLat, jobLon);
          const distKm = Math.round(exactDist * 100) / 100;
          const distText = exactDist < 1 ? `${Math.max(10, Math.round(exactDist * 1000))} m` : `${(Math.round(exactDist * 10) / 10).toFixed(1)} km`;

          let typeStr = 'Vollzeit';
          const az = item.arbeitszeit?.toLowerCase() || '';
          if (az === 'tz' || az.includes('teilzeit')) typeStr = 'Teilzeit';
          if (az === 'mj' || az.includes('minijob')) typeStr = 'Minijob';
          if (az.includes('home') || az.includes('remot')) typeStr = 'Homeoffice / Remote';

          const redirectUrl = item.externeUrl ||
            (item.refnr ? `https://www.arbeitsagentur.de/jobsuche/jobdetail/${item.refnr}` : 'https://www.arbeitsagentur.de/jobsuche/');

          const locName = [item.arbeitsort?.plz, item.arbeitsort?.ort]
            .filter(Boolean)
            .join(' ') || 'Deutschland';

          // Helper for industry photos & tailored job details
          const titleLower = (item.titel || item.beruf || '').toLowerCase();

          let images = [
            'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
            'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80'
          ];
          let industry = 'Dienstleistungen & Beratung';
          let requirements = [
            'Erfolgreich abgeschlossene Ausbildung oder entsprechendes Studium',
            'Mehrjährige praktische Erfahrungen im beschriebenen Aufgabenfeld',
            'Eigenverantwortliche, lösungsorientierte und strukturierte Arbeitsweise',
            'Starke Team- und Kommunikationsfähigkeit',
            'Fließende Deutschkenntnisse in Wort und Schrift'
          ];
          const responsibilities = [
            'Verantwortung für anspruchsvolle Aufgaben in deinem Spezialgebiet',
            'Mitarbeit an innovativen Projekten im interdisziplinären Team',
            'Kontinuierliche Optimierung von Arbeitsprozessen und Schnittstellen',
            'Direkter Ansprechpartner für Kunden, Partner oder interne Abteilungen'
          ];
          const benefits = [
            'Flexible Arbeitszeiten & Hybrides Arbeiten (Homeoffice)',
            '30 Tage Urlaub & Sonderurlaubstage',
            'Attraktive Vergütung nach Tarif / Branchenstandard + Boni',
            'JobRad-Leasing & ÖPNV-Fahrtkostenzuschuss',
            'Betriebliche Altersvorsorge & Gesundheitsbudget',
            'Umfangreiche Weiterbildungsangebote & Mentoring'
          ];

          if (titleLower.match(/software|developer|it|data|system|analyst|informatik/)) {
            images = [
              'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
              'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
              'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80'
            ];
            industry = 'Software & Informationstechnologie';
            requirements = [
              'Fundierte Kenntnisse in modernen Programmiersprachen & Frameworks',
              'Erfahrung mit Datenstrukturen, APIs und cloud-basierten Architekturen',
              'Freude am Lösen komplexer technischer Herausforderungen',
              'Gute Deutsch- und Englischkenntnisse'
            ];
          } else if (titleLower.match(/verkäufer|drogerie|supermarkt|retail|filiale|kasse|dm|edeka|rewe|aldi|lidl|kaufland/)) {
            images = [
              'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&q=80',
              'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&q=80',
              'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&q=80'
            ];
            industry = 'Einzelhandel & Konsumgüter';
            requirements = [
              'Freude am Kundenkontakt und kundenorientiertes Auftreten',
              'Zuverlässigkeit, Pünktlichkeit und Teamgeist',
              'Bereitschaft zur Schichtarbeit im Rahmen der Öffnungszeiten',
              'Kaufmännisches Grundverständnis von Vorteil'
            ];
          } else if (titleLower.match(/pflege|arzt|medizin|gesundheit|klinik|mfa/)) {
            images = [
              'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
              'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&q=80',
              'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80'
            ];
            industry = 'Gesundheitswesen & Pflege';
            requirements = [
              'Examen in der Gesundheits- und Krankenpflege / Altenpflege oder MFA',
              'Hohes Maß an Empathie, Zuverlässigkeit und Patientenorientierung',
              'Bereitschaft zum Schichtdienst',
              'Verantwortungsbewusstes Handeln in Akutsituationen'
            ];
          } else if (titleLower.match(/mechatroniker|ingenieur|elektroniker|monteur|produktion|mechaniker|bau/)) {
            images = [
              'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
              'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
              'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&q=80'
            ];
            industry = 'Industrie, Maschinenbau & Technik';
          }

          return {
            id: item.refnr || `ba-${idx}`,
            title: item.titel || item.beruf || 'Stellenangebot',
            company_name: item.arbeitgeber || 'Unternehmen',
            location_name: locName,
            latitude: jobLat,
            longitude: jobLon,
            exact_distance: exactDist,
            distance: distKm,
            distance_text: distText,
            type: typeStr,
            redirect_url: redirectUrl,
            published_date: item.aktuelleVeroeffentlichungsdatum || new Date().toISOString().split('T')[0],
            beruf: item.beruf || item.titel,
            rating: (4.0 + (idx % 10) * 0.1).toFixed(1),
            company_size: idx % 2 === 0 ? '500 - 2.500 Mitarbeiter' : '10.000+ Mitarbeiter',
            industry: industry,
            description: `Unser Partnerunternehmen ${item.arbeitgeber || 'Arbeitgeber'} sucht ab sofort Verstärkung für das Team in ${locName}. Wir bieten ein hochmotiviertes Arbeitsumfeld, moderne Arbeitsmittel und hervorragende Perspektiven zur beruflichen Weiterentwicklung.`,
            images: images,
            requirements: requirements,
            responsibilities: responsibilities,
            benefits: benefits,
            routes: {
              driving: Math.max(1, Math.round((exactDist / 50) * 60)) + ' Min',
              cycling: Math.max(1, Math.round((exactDist / 15) * 60)) + ' Min',
              walking: Math.max(1, Math.round((exactDist / 5) * 60)) + ' Min'
            }
          };
        });

        // Filter by jobType if specified
        let filteredJobs = jobs;
        if (jobType && jobType !== 'Alle') {
          filteredJobs = jobs.filter(j => j.type.toLowerCase().includes(jobType.toLowerCase()));
        }

        // Sort strictly by exact distance ascending (nearest jobs first)
        filteredJobs.sort((a, b) => a.exact_distance - b.exact_distance);

        return NextResponse.json({ jobs: filteredJobs, source: 'Arbeitsagentur API', total: filteredJobs.length });
      }
    }
  } catch (err) {
    console.error('Error fetching real jobs from Arbeitsagentur API:', err);
  }

  // Fallback to mock jobs if API request failed or returned 0 results
  const fallback = generateFallbackJobs(lat, lon, radius, 30);
  return NextResponse.json({ jobs: fallback, source: 'Generated', total: fallback.length });
}
