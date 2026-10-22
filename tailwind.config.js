/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#1686A8",
          dark: "#65C7E5",
          DEFAULT: "#1686A8",
          50: "#F0F9FB",
          100: "#D8F1F8",
          200: "#B3E3F1",
          300: "#80CEE6",
          400: "#48B5D8",
          500: "#1686A8",
          600: "#116F8C",
          700: "#0D576E",
          800: "#0A4354",
          900: "#062B36",
        },
        bg: {
          light: "#F7F8FA",
          dark: "#101820",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#19232D",
          subtle: {
            light: "#EEF1F4",
            dark: "#222F3D",
          },
        },
        text: {
          primary: {
            light: "#18232D",
            dark: "#F1F5F9",
          },
          secondary: {
            light: "#64748B",
            dark: "#94A3B8",
          },
        },
        border: {
          light: "#E2E8F0",
          dark: "#283545",
        },
      },
      borderRadius: {
        card: "16px",
        btn: "12px",
      },
    },
  },
  plugins: [],
};
