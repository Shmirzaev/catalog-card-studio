import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        milana: {
          taupe: "#aaa095",
          cream: "#f4f0eb",
          ink: "#111111",
          panel: "#fbfaf7"
        }
      },
      boxShadow: {
        soft: "0 18px 70px rgba(48, 38, 30, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
