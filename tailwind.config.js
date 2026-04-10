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
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)', opacity: '0.7' },
          '50%':       { transform: 'translateY(6px)', opacity: '1' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.5' },
          '50%':       { opacity: '1' },
        },
      },
      animation: {
        float:        'float 2.4s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
