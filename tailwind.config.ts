import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      mont: "var(--mont-font)",
      work: "var(--work-font)",
    },
    extend: {
      colors: {
        "parts-pass-dark-blue": "#11224d",
        "parts-pass-blue": "#1759C1",
        "parts-pass-blue-light": "#2069DD",
        "parts-pass-green": "#85dd85",
        "parts-pass-gray": "#666667",
        "parts-pass-white": "#ecebe8",
      },
      animation: {
        "infinite-scroll": "infinite-scroll 25s linear infinite",
      },
      keyframes: {
        "infinite-scroll": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
export default config;
