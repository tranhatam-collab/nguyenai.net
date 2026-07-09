/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        academy: {
          bg: '#FFFAF0',
          header: '#7A2212',
          accent: '#A6260C',
          accentDark: '#7A2212',
          text: '#4A1D14',
          muted: '#8A6B5E',
          border: 'rgba(74, 29, 20, 0.12)',
          gold: '#FFB810',
          orange: '#E55B09',
          sun: '#F48B0D',
          cream: '#FFFACC',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Noto Serif"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
