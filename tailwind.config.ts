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
        background: '#090d16',
        card: '#111827',
        surface: 'rgba(17, 24, 39, 0.75)',
        primary: '#2563eb',
        accent: '#38bdf8',
        indigo: '#6366f1',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        text: '#f8fafc',
        secondary: '#94a3b8',
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
