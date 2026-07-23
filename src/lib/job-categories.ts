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

  if (text.match(/software|developer|it|data|system|analyst|frontend|backend|fullstack|cloud|cyber|ki|ai|informatik|programm/)) {
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

  if (text.match(/verkäufer|drogerie|supermarkt|kaufmann|kauffrau|retail|filiale|kasse|dm|edeka|rewe|aldi|lidl|kaufland|filialleiter|store|markt/)) {
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

  if (text.match(/pflege|arzt|ärztin|medizin|gesundheit|klinik|mfa|krankenschwester|therapeut|pharma|apotheke/)) {
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

  if (text.match(/mechatroniker|ingenieur|elektroniker|monteur|produktion|mechaniker|bau|handwerk|techniker|schlosser|schweißer/)) {
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

  if (text.match(/logistik|fahrer|lager|spedition|zusteller|kraftfahrer|staplerfahrer|lagerist|kurier/)) {
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

  if (text.match(/projektleiter|beratung|consulting|vertrieb|buchhalter|management|hr|personal|finanz|marketing|büro|assistenz/)) {
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
