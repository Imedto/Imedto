/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#452B97',
        'primary-light': '#EFEFFF',
        'primary-medium': '#ABABE2',
        'primary-dark': '#241554',
        'gray-300': '#D2D2D2',
        'gray-600': '#6E6E6E',
        'gray-800': '#373737',
      },
      fontFamily: {
        nunito: 'Nunito, sans-serif',
      },
    },
  },
  plugins: [],
}
