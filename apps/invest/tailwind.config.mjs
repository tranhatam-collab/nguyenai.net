/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // V3.0 brand palette — heritage-dark base with gold accents
        bg: {
          DEFAULT: '#7A2212',
          soft: '#4A1D14',
          card: '#FFFAF0',
          border: 'rgba(74, 29, 20, 0.12)',
        },
        gold: {
          DEFAULT: '#FFB810',
          light: '#FFD060',
          dark: '#E5A300',
        },
        ink: {
          DEFAULT: '#4A1D14',
          muted: '#8A6B5E',
          dim: '#A88B7E',
        },
        'heritage-red': '#A6260C',
        'burnt-orange': '#E55B09',
        'sun-orange': '#F48B0D',
        'light-cream': '#FFFACC',
        'surface': '#FFFAF0',
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
