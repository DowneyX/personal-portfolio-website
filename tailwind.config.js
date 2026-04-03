/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#86a6f1ff', // primary color
          hover: '#5e8bebff' // darker shade for hover
        },
      },
    },
  },
  variants: {},
  plugins: [],
};