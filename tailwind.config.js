const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        karma: ["Source Karma", "serif"],
      },
      colors: {
        primary: colors.orange,
        secondary: colors.teal,
        tertiary: colors.emerald,
        dark: colors.slate,
      },
    },
  },
  plugins: [],
};
