import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#05070A',
        card: '#0D1117',
        surface: '#111827',
        primary: '#3B82F6',
        accent: '#8B5CF6',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        text: '#FFFFFF',
        secondary: '#A1A1AA',
        border: 'rgba(255,255,255,0.08)',
      },
      boxShadow: {
        soft: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)', // Example soft shadow, adjust as needed
      },
    },
  },
  plugins: [],
};
export default config;
