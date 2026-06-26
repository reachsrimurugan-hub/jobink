/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8f3bf6',
          dark: '#7723dd',
          light: '#a36bff',
          bg: '#f5efff',
        },
        rebeccapurple: {
          50: '#f5efff',
          100: '#ebdeff',
          200: '#d8bfff',
          300: '#be99ff',
          400: '#a36bff',
          500: '#8f3bf6',
          600: '#7723dd',
          700: '#5f1ab8',
          800: '#4d1596',
          900: '#3e107d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
