/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        offwhite: '#F5F5F7',
        brand: {
          1: '#2a5c4f',
          2: '#557d72',
          3: '#94aea7',
        },
        // Design system semantic colors
        sys: {
          blue:   '#0a84ff',
          green:  '#34c759',
          red:    '#ff375f',
          yellow: '#ffd60a',
        },
      },
      letterSpacing: {
        snug: '-0.01em',
        tight: '-0.025em',
        tighter: '-0.03em',
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
        livepulse: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(52,199,89,.45)' },
          '55%':      { boxShadow: '0 0 0 5px rgba(52,199,89,.00)' },
        },
      },
      animation: {
        float:        'float 2.4s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 2.4s ease-in-out infinite',
        livepulse:    'livepulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
