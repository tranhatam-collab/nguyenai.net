/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Investor theme — dark background with gold accents
        bg: {
          DEFAULT: '#0a0e1a',
          soft: '#111726',
          card: '#161d2e',
          border: '#1f2940',
        },
        gold: {
          DEFAULT: '#d4af37',
          light: '#e6c757',
          dark: '#b8941f',
        },
        ink: {
          DEFAULT: '#e8ecf4',
          muted: '#9aa6c0',
          dim: '#6b7693',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
