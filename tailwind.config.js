/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Display'",
          "'SF Pro Text'",
          "'Helvetica Neue'",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        ink: "#0B0F0E",
        paper: "#F5F5F2",
        mist: "#E4E4DF",
        accent: "#2F6F62",
        gold: "#C69C4B",
        clay: "#C1553D",
      },
      maxWidth: {
        copy: "38rem",
      },
    },
  },
  plugins: [],
};
