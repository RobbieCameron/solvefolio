import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172026",
        paper: "#f7f4ed",
        moss: "#4f684f",
        coral: "#d7664b",
        steel: "#456173",
        lemon: "#e7c85f"
      },
      boxShadow: {
        soft: "0 16px 45px rgba(23, 32, 38, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
