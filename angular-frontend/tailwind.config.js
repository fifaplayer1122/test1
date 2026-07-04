/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'smartdocs': {
          'primary': '#1a237e',
          'secondary': '#283593',
          'accent': '#3949ab',
        }
      }
    },
  },
  plugins: [],
}
