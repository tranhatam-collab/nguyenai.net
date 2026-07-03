/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Console theme
        bg: {
          DEFAULT: '#0a0e1a',
          sidebar: '#111827',
          card: '#1a2235',
          hover: '#243049',
        },
        accent: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
          muted: '#3b82f6',
        },
        status: {
          active: '#22c55e',
          idle: '#eab308',
          offline: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
