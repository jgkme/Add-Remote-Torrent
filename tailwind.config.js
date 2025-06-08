/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Switch to class-based dark mode
  content: [
    "./options/**/*.html",
    "./options/**/*.js",
    "./popup/**/*.html",
    "./popup/**/*.js",
    "./confirmAdd/**/*.html",
    "./confirmAdd/**/*.js",
    "./content_script.js", 
  ],
  theme: {
    extend: {
      zIndex: {
        '9999': '9999',
      }
    },
  },
  plugins: [],
}
