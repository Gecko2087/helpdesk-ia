export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          background: "#F7F7F2",
          surface: "#FFFFFF",
          muted: "#EFEFE8",
          text: "#171717",
          secondary: "#60615C",
          sidebar: "#111412",
          border: "#DADBD2",
          accent: "#18A058",
          cyan: "#00A7A7",
          critical: "#D92D20",
          high: "#E56B2F",
          medium: "#C99700",
          low: "#2E7D32"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        subtle: "0 10px 30px rgba(17, 20, 18, 0.06)"
      }
    }
  },
  plugins: []
};
