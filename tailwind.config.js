/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs", "./public/js/**/*.js"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9ecff",
          200: "#baddff",
          300: "#8ec8ff",
          400: "#58a8ff",
          500: "#2d88ff",
          600: "#1769e6",
          700: "#1253b4",
          800: "#134793",
          900: "#163d78",
        },
        sidebar: {
          bg: "#0f172a",
          hover: "#1e293b",
          active: "#1e3a5f",
          border: "#1e293b",
          text: "#94a3b8",
          heading: "#f8fafc",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.06)",
        "card-hover":
          "0 4px 12px rgba(0,0,0,0.10), 0 12px 32px rgba(0,0,0,0.08)",
        input: "0 1px 2px rgba(0,0,0,0.05)",
        glow: "0 10px 40px rgba(45,136,255,0.18)",
        panelLight:
          "0 0 0 1px rgba(15,23,42,0.06), 0 18px 60px rgba(15,23,42,0.10)",
        panelDark:
          "0 0 0 1px rgba(255,255,255,0.06), 0 24px 80px rgba(2,6,23,0.45)",
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        "float-slow": "floatSlow 11s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        pulsegrid: "pulsegrid 10s ease-in-out infinite",
        marquee: "marquee 26s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        floatSlow: {
          "0%, 100%": {
            transform: "translateY(0px) translateX(0px)",
          },
          "50%": {
            transform: "translateY(-18px) translateX(6px)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulsegrid: {
          "0%, 100%": { opacity: "0.06" },
          "50%": { opacity: "0.12" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(100,116,139,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.15) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
