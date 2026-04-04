/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        offwhite: '#F5F5F7',
        brand: {
          1: '#2a5c4f',
          2: '#557d72',
          3: '#94aea7',
        },
      },
    },
  },
  plugins: [],
}
