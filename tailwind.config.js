/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F6F7FB',
        surface: '#FFFFFF',
        'surface-2': '#F8F9FD',
        ink: '#141824',
        'ink-muted': '#6B7280',
        'ink-light': '#9CA3AF',
        border: '#E6E9F2',
        'border-light': '#EEF1F8',
        brand: {
          charcoal: '#292929',
          'charcoal-dark': '#171717',
          red: '#F21624',
          'red-dark': '#C81320',
          cyan: '#00A6BD',
          'cyan-dark': '#008A9D',
        },
        semantic: {
          teal: '#14B8A6',
          'teal-light': '#E6FFFA',
          amber: '#F59E0B',
          'amber-light': '#FEF3C7',
          red: '#EF4444',
          'red-light': '#FEE2E2',
          green: '#10B981',
          'green-light': '#D1FAE5',
          blue: '#3B82F6',
          'blue-light': '#DBEAFE',
        }
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '18px',
        modal: '22px',
        pill: '9999px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        card: '0 4px 16px -2px rgba(25, 25, 25, 0.05), 0 2px 6px -1px rgba(25, 25, 25, 0.03)',
        cardHover: '0 12px 28px -4px rgba(25, 25, 25, 0.08), 0 4px 12px -2px rgba(25, 25, 25, 0.04)',
        modal: '0 24px 48px -12px rgba(25, 25, 25, 0.25)',
      }
    },
  },
  plugins: [],
}
