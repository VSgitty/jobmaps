export interface JobAgeInfo {
  daysOld: number;
  label: string;
  category: 'green' | 'yellow' | 'orange' | 'red';
  hexColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dotColor: string;
  warningText?: string;
}

/**
 * Calculates the exact age in days from a published date string (YYYY-MM-DD or ISO)
 * and returns consistent color scale tokens across the platform:
 * 🟢 < 7 Tage (0-6 Tage)
 * 🟡 7–16 Tage
 * 🟠 17–30 Tage
 * 🔴 > 30 Tage
 */
export function calculateJobAge(publishedDateStr?: string, defaultDays?: number): JobAgeInfo {
  let daysOld = 0;

  if (publishedDateStr) {
    try {
      const pubDate = new Date(publishedDateStr);
      const now = new Date();
      if (!isNaN(pubDate.getTime())) {
        const diffTime = Math.abs(now.getTime() - pubDate.getTime());
        daysOld = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      } else if (typeof defaultDays === 'number') {
        daysOld = defaultDays;
      }
    } catch {
      daysOld = defaultDays || 3;
    }
  } else if (typeof defaultDays === 'number') {
    daysOld = defaultDays;
  }

  // Handle negative or future dates gracefully
  if (daysOld < 0) daysOld = 0;

  if (daysOld <= 6) {
    return {
      daysOld,
      label: daysOld === 0 ? 'Heute' : daysOld === 1 ? 'Gestern' : `Vor ${daysOld} Tagen`,
      category: 'green',
      hexColor: '#10b981',
      badgeBg: 'bg-emerald-500/20',
      badgeBorder: 'border-emerald-500/40',
      badgeText: 'text-emerald-300',
      dotColor: 'bg-emerald-400'
    };
  }

  if (daysOld <= 16) {
    return {
      daysOld,
      label: `Vor ${daysOld} Tagen`,
      category: 'yellow',
      hexColor: '#eab308',
      badgeBg: 'bg-yellow-500/20',
      badgeBorder: 'border-yellow-500/40',
      badgeText: 'text-yellow-300',
      dotColor: 'bg-yellow-400'
    };
  }

  if (daysOld <= 30) {
    return {
      daysOld,
      label: `Vor ${daysOld} Tagen`,
      category: 'orange',
      hexColor: '#f97316',
      badgeBg: 'bg-orange-500/20',
      badgeBorder: 'border-orange-500/40',
      badgeText: 'text-orange-300',
      dotColor: 'bg-orange-400'
    };
  }

  return {
    daysOld,
    label: `Vor ${daysOld} Tagen`,
    category: 'red',
    hexColor: '#ef4444',
    badgeBg: 'bg-red-500/25',
    badgeBorder: 'border-red-500/50',
    badgeText: 'text-red-300 font-black',
    dotColor: 'bg-red-500',
    warningText: '⚠️ Stelle möglicherweise veraltet'
  };
}
