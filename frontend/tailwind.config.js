/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#effaf3",
          100: "#d8f2e0",
          500: "#2d8a4d",
          600: "#237240",
          700: "#1b5832"
        },
        slate: {
          850: "#1b2520"
        }
      },
      boxShadow: {
        soft: "0 16px 40px rgba(16, 24, 20, 0.08)"
      }
    }
  },
  plugins: []
};
