export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Oswald', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  safelist: ['bg-blue-100', 'outline', 'outline-blue-300'],
}
