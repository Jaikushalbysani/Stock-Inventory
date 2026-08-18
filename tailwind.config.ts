import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff8ed",
          100: "#ffefd4",
          200: "#fedba8",
          300: "#fdc171",
          400: "#fb9e38",
          500: "#f98212",
          600: "#ea6708",
          700: "#c24d09",
          800: "#9a3d10",
          900: "#7c3410",
        },
      },
    },
  },
  plugins: [],
};

export default config;
