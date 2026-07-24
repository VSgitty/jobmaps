export interface CompanyStyle {
  name: string;
  hexColor: string;
  brandBadgeBg: string;
  brandBadgeText: string;
  borderAccentStyle: string;
  shortLogo: string;
}

const DETERMINISTIC_PALETTE = [
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#a855f7', // Purple
  '#38bdf8', // Sky
  '#fb923c', // Orange
  '#f43f5e', // Rose
];

/**
 * Returns a consistent, deterministic brand color and style for any company name.
 * Well-known German brand names return official corporate colors.
 */
export function getCompanyStyle(companyName: string = ''): CompanyStyle {
  const name = companyName.trim();
  const lower = name.toLowerCase();

  // Known Corporate Brands
  if (lower.includes('netto')) {
    return { name, hexColor: '#FFD100', brandBadgeBg: 'bg-[#FFD100]', brandBadgeText: 'text-black font-black', borderAccentStyle: 'border-[#FFD100]', shortLogo: 'Netto' };
  }
  if (lower.includes('rewe')) {
    return { name, hexColor: '#CC071E', brandBadgeBg: 'bg-[#CC071E]', brandBadgeText: 'text-white font-extrabold', borderAccentStyle: 'border-[#CC071E]', shortLogo: 'REWE' };
  }
  if (lower.includes('edeka')) {
    return { name, hexColor: '#005CA9', brandBadgeBg: 'bg-[#005CA9]', brandBadgeText: 'text-yellow-400 font-extrabold', borderAccentStyle: 'border-[#005CA9]', shortLogo: 'EDEKA' };
  }
  if (lower.includes('siemens')) {
    return { name, hexColor: '#009999', brandBadgeBg: 'bg-[#009999]', brandBadgeText: 'text-white font-extrabold', borderAccentStyle: 'border-[#009999]', shortLogo: 'SIE' };
  }
  if (lower.includes('bosch')) {
    return { name, hexColor: '#ED0007', brandBadgeBg: 'bg-[#ED0007]', brandBadgeText: 'text-white font-extrabold', borderAccentStyle: 'border-[#ED0007]', shortLogo: 'BOS' };
  }
  if (lower.includes('telekom')) {
    return { name, hexColor: '#E20074', brandBadgeBg: 'bg-[#E20074]', brandBadgeText: 'text-white font-extrabold', borderAccentStyle: 'border-[#E20074]', shortLogo: 'T' };
  }
  if (lower.includes('deutsche bahn') || lower.includes(' db ') || lower.startsWith('db ')) {
    return { name, hexColor: '#FF0000', brandBadgeBg: 'bg-[#FF0000]', brandBadgeText: 'text-white font-extrabold', borderAccentStyle: 'border-[#FF0000]', shortLogo: 'DB' };
  }
  if (lower.includes('aldi')) {
    return { name, hexColor: '#003282', brandBadgeBg: 'bg-[#003282]', brandBadgeText: 'text-white font-extrabold', borderAccentStyle: 'border-[#003282]', shortLogo: 'ALDI' };
  }
  if (lower.includes('lidl')) {
    return { name, hexColor: '#0050AA', brandBadgeBg: 'bg-[#0050AA]', brandBadgeText: 'text-yellow-400 font-extrabold', borderAccentStyle: 'border-[#0050AA]', shortLogo: 'Lidl' };
  }
  if (lower.includes('kaufland')) {
    return { name, hexColor: '#E3000F', brandBadgeBg: 'bg-[#E3000F]', brandBadgeText: 'text-white font-extrabold', borderAccentStyle: 'border-[#E3000F]', shortLogo: 'K' };
  }
  if (lower.includes('dm-drogerie') || lower.includes('dm ')) {
    return { name, hexColor: '#003282', brandBadgeBg: 'bg-[#003282]', brandBadgeText: 'text-yellow-400 font-extrabold', borderAccentStyle: 'border-[#003282]', shortLogo: 'dm' };
  }
  if (lower.includes('rossmann')) {
    return { name, hexColor: '#E3000F', brandBadgeBg: 'bg-[#E3000F]', brandBadgeText: 'text-white font-extrabold', borderAccentStyle: 'border-[#E3000F]', shortLogo: 'R' };
  }
  if (lower.includes('allianz')) {
    return { name, hexColor: '#003781', brandBadgeBg: 'bg-[#003781]', brandBadgeText: 'text-white font-extrabold', borderAccentStyle: 'border-[#003781]', shortLogo: 'Allianz' };
  }
  if (lower.includes('k&s') || lower.includes('gersprenz') || lower.includes('senioren')) {
    return { name, hexColor: '#005b82', brandBadgeBg: 'bg-[#005b82]', brandBadgeText: 'text-white font-extrabold', borderAccentStyle: 'border-[#005b82]', shortLogo: 'K&S' };
  }
  if (lower.includes('dhl') || lower.includes('deutsche post')) {
    return { name, hexColor: '#FFCC00', brandBadgeBg: 'bg-[#FFCC00]', brandBadgeText: 'text-black font-extrabold', borderAccentStyle: 'border-[#FFCC00]', shortLogo: 'DHL' };
  }

  // Deterministic Hash Function for any other company
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = lower.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % DETERMINISTIC_PALETTE.length;
  const hexColor = DETERMINISTIC_PALETTE[colorIndex];

  // Abbreviate shortLogo
  const words = name.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  let shortLogo = '🏢';
  if (words.length >= 2) {
    shortLogo = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    shortLogo = words[0].substring(0, 3).toUpperCase();
  }

  return {
    name,
    hexColor,
    brandBadgeBg: `bg-[${hexColor}]`,
    brandBadgeText: 'text-white font-extrabold',
    borderAccentStyle: `border-[${hexColor}]`,
    shortLogo
  };
}
