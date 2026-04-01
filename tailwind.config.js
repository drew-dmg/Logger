/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0b0b0d',
        panel: '#141419',
        edge: '#23232a',
        text: '#e5e7eb',
        muted: '#9ca3af',
        accent: '#9fb3ff'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
