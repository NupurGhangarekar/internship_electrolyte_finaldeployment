export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui"] },
      colors: { brand: { 50: "#eef6ff", 100: "#d9eaff", 500: "#2374e1", 600: "#1d5fbf", 700: "#164c99" } }
    }
  },
  plugins: []
};
