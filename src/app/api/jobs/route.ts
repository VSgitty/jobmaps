import { NextResponse } from 'next/server';

// This is a stub for real jobs API.
// To use real jobs, you could integrate Adzuna API, Jooble API, or Arbeitsagentur API here.
// Example: https://api.adzuna.com/v1/api/jobs/de/search/1?app_id=YOUR_ID&app_key=YOUR_KEY&where=${lat},${lon}&distance=${radius}

const JOB_TITLES = ["Software Engineer", "Mechatroniker", "Marketing Manager", "Projektleiter", "Data Analyst", "Buchhalter", "Pflegefachkraft", "Verkäufer", "Elektroniker"];
const COMPANY_NAMES = ["SIEMENS", "Deutsche Bahn", "Lufthansa", "Allianz", "BMW", "SAP", "Bosch", "Telekom", "Aldi", "Edeka"];

function generateMockJobs(lat: number, lon: number, radiusKm: number, count: number = 20) {
  const jobs = [];
  for (let i = 0; i < count; i++) {
    // Generate random coordinates within radius
    const radiusInDegrees = radiusKm / 111.12; // roughly 111km per degree
    const randomRadius = Math.random() * radiusInDegrees;
    const randomAngle = Math.random() * 2 * Math.PI;
    const jobLat = lat + randomRadius * Math.cos(randomAngle);
    const jobLon = lon + randomRadius * Math.sin(randomAngle);
    
    // Distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = (jobLat - lat) * (Math.PI / 180);
    const dLon = (jobLon - lon) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat * (Math.PI / 180)) * Math.cos(jobLat * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    jobs.push({
      id: i.toString(),
      title: JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)],
      company_name: COMPANY_NAMES[Math.floor(Math.random() * COMPANY_NAMES.length)],
      location_name: "In der Nähe",
      latitude: jobLat,
      longitude: jobLon,
      distance: distance,
      type: Math.random() > 0.3 ? "Vollzeit" : "Teilzeit",
      salary_min: Math.floor(Math.random() * 20 + 30) + ".000 €",
      salary_max: Math.floor(Math.random() * 30 + 50) + ".000 €",
      redirect_url: "https://www.arbeitsagentur.de/jobsuche/",
      // Mock routing durations roughly based on distance
      routes: {
        driving: Math.round((distance / 50) * 60) + " Min", // 50km/h avg
        cycling: Math.round((distance / 15) * 60) + " Min", // 15km/h avg
        walking: Math.round((distance / 5) * 60) + " Min"   // 5km/h avg
      }
    });
  }
  
  // Sort by distance
  return jobs.sort((a, b) => a.distance - b.distance);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '50.1109');
  const lon = parseFloat(searchParams.get('lon') || '8.6821');
  const radius = parseFloat(searchParams.get('radius') || '25');

  // In a real scenario:
  // const res = await fetch(`https://api.adzuna.com/v1/api/jobs/de/search/1?app_id=${process.env.ADZUNA_ID}&app_key=${process.env.ADZUNA_KEY}&where=${lat},${lon}&distance=${radius}`);
  // const data = await res.json();
  
  const jobs = generateMockJobs(lat, lon, radius, 30);

  return NextResponse.json({ jobs });
}