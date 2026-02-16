/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx,html}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light theme
        'reader-light': {
          bg: '#ffffff',
          'bg-secondary': '#f5f5f5',
          text: '#1a1a1a',
          'text-secondary': '#666666',
          accent: '#3b82f6',
        },
        // Dark theme
        'reader-dark': {
          bg: '#1a1a1a',
          'bg-secondary': '#2d2d2d',
          text: '#e5e5e5',
          'text-secondary': '#a0a0a0',
          accent: '#60a5fa',
        },
        // Sepia theme
        'reader-sepia': {
          bg: '#f4ecd8',
          'bg-secondary': '#e8dfc9',
          text: '#5b4636',
          'text-secondary': '#8b7355',
          accent: '#c4956a',
        },
      },
      fontFamily: {
        'reader': ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        'reader-sans': ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
