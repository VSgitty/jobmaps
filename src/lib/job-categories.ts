import { Laptop, ShoppingBag, HeartPulse, Wrench, Truck, Briefcase, LucideIcon, Sparkles } from "lucide-react";

export interface CategoryInfo {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
  icon: LucideIcon;
}

export function getJobCategory(jobTitle: string = '', companyName: string = '', beruf: string = ''): CategoryInfo {
  const text = `${jobTitle} ${companyName} ${beruf}`.toLowerCase();

  // 1. Medizin & Pflege (Checked first to prevent 'Pflegedienstleitung' from matching 'it' in Leitung)
  if (text.match(/pflege|pfleger|pflegefachkraft|altenpflege|krankenpflege|arzt|ärztin|medizin|gesundheit|klinik|mfa|krankenschwester|therapeut|pharma|apotheke|hebamme|sanitäter/)) {
    return {
      id: 'medical',
      name: 'Medizin & Pflege',
      color: '#f43f5e',
      bgColor: 'bg-rose-500',
      borderColor: 'border-rose-500',
      textColor: 'text-rose-400',
      badgeBg: 'bg-rose-500/15',
      icon: HeartPulse
    };
  }

  // 2. Handel & Filiale (Verkäufer, Netto, Edeka, REWE, Lidl, Aldi, Kassierer)
  if (text.match(/verkäufer|verkaeufer|drogerie|supermarkt|kaufmann|kauffrau|retail|filiale|kasse|kassierer|dm|edeka|rewe|aldi|lidl|kaufland|netto|penny|filialleiter|store|markt|einzelhandel/)) {
    return {
      id: 'retail',
      name: 'Handel & Filiale',
      color: '#10b981',
      bgColor: 'bg-emerald-500',
      borderColor: 'border-emerald-500',
      textColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/15',
      icon: ShoppingBag
    };
  }

  // 3. Industrie, Handwerk & Technik
  if (text.match(/mechatroniker|ingenieur|elektroniker|monteur|produktion|mechaniker|bau|handwerk|techniker|schlosser|schweißer|schweisser|kälte|wärme|elektriker|maler|tischler|anlagenmechaniker/)) {
    return {
      id: 'crafts',
      name: 'Industrie & Handwerk',
      color: '#f59e0b',
      bgColor: 'bg-amber-500',
      borderColor: 'border-amber-500',
      textColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/15',
      icon: Wrench
    };
  }

  // 4. Lager & Logistik
  if (text.match(/logistik|fahrer|postbote|zusteller|paket|lager|spedition|kraftfahrer|staplerfahrer|lagerist|kurier|transport|auslieferung/)) {
    return {
      id: 'logistics',
      name: 'Lager & Logistik',
      color: '#06b6d4',
      bgColor: 'bg-cyan-500',
      borderColor: 'border-cyan-500',
      textColor: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/15',
      icon: Truck
    };
  }

  // 5. IT & Software (Using strict word boundaries \b for short terms 'it', 'ai', 'ki')
  if (text.match(/\b(it|ai|ki)\b|software|developer|devops|data|systemadmin|administrator|analyst|frontend|backend|fullstack|cloud|cyber|informatik|programmierer|webentwickler/)) {
    return {
      id: 'it',
      name: 'IT & Tech',
      color: '#3b82f6',
      bgColor: 'bg-blue-500',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-400',
      badgeBg: 'bg-blue-500/15',
      icon: Laptop
    };
  }

  // 6. Büro, Management & Verwaltung
  if (text.match(/projektleiter|beratung|consulting|vertrieb|buchhalter|management|hr|personal|finanz|marketing|büro|buero|assistenz|sekretär|sachbearbeiter/)) {
    return {
      id: 'business',
      name: 'Büro & Management',
      color: '#8b5cf6',
      bgColor: 'bg-violet-500',
      borderColor: 'border-violet-500',
      textColor: 'text-violet-400',
      badgeBg: 'bg-violet-500/15',
      icon: Briefcase
    };
  }

  return {
    id: 'general',
    name: 'Dienstleistung',
    color: '#ec4899',
    bgColor: 'bg-pink-500',
    borderColor: 'border-pink-500',
    textColor: 'text-pink-400',
    badgeBg: 'bg-pink-500/15',
    icon: Sparkles
  };
}
