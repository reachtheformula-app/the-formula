/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#ecddce',
        sand: '#d0bfa3',
        dune: '#c9af97',
        terra: '#be8a68',
        bark: '#926f4a',
        wood: '#774722',
      },
      fontFamily: {
        quicksand: ['Quicksand', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
