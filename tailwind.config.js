export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    borderRadius: { none: "0", sm: "2px", DEFAULT: "3px", md: "4px", lg: "4px", xl: "5px", "2xl": "6px", "3xl": "6px", full: "9999px" },
    extend: {
      fontFamily: { sans: ["IRANSans", "Tahoma", "Arial", "sans-serif"] },
      colors: { navy: "#202747", brand: "#5c58ac" },
    },
  },
  plugins: [],
};
