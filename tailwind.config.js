/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f4f6f8',
          100: '#e6eaef',
          200: '#c9d2dc',
          300: '#a1aec0',
          400: '#74849c',
          500: '#566380',
          600: '#404c66',
          700: '#2f3852',
          800: '#1f2740',
          900: '#131a2e',
          950: '#0b0f1f',
        },
        clay: {
          50: '#fdf6f0',
          100: '#f9e8d9',
          200: '#f2ccae',
          300: '#e8aa79',
          400: '#dd8548',
          500: '#c96a2c',
          600: '#a95121',
          700: '#873d1d',
          800: '#6e321d',
          900: '#5b2a1b',
        },
        sage: {
          50: '#f2f7f3',
          100: '#dfeee2',
          200: '#c0dcc8',
          300: '#95c2a4',
          400: '#67a37c',
          500: '#458560',
          600: '#33694c',
          700: '#2a543f',
          800: '#234335',
          900: '#1c372c',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 10px -2px rgba(19, 26, 46, 0.08), 0 8px 30px -8px rgba(19, 26, 46, 0.10)',
        card: '0 1px 2px rgba(19,26,46,0.06), 0 6px 20px -6px rgba(19,26,46,0.12)',
      },
      borderRadius: {
        xl2: '1.1rem',
      },
    },
  },
  plugins: [],
};
