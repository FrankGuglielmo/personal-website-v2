/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--color-bg) / <alpha-value>)",
        surface: "hsl(var(--color-surface) / <alpha-value>)",
        text: "hsl(var(--color-text) / <alpha-value>)",
        muted: "hsl(var(--color-muted) / <alpha-value>)",
        accent: "hsl(var(--color-accent) / <alpha-value>)",
        border: "hsl(var(--color-border) / <alpha-value>)"
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        '2xl': "var(--radius-2xl)",
        '3xl': "var(--radius-3xl)"
      },
      boxShadow: {
        glass: "0 1px 0 0 rgba(255,255,255,0.25) inset, 0 8px 30px rgba(0,0,0,0.15)",
        elevation: "0 10px 20px rgba(0,0,0,0.08), 0 6px 6px rgba(0,0,0,0.06)"
      },
      backdropBlur: {
        xs: '2px'
      }
    },
  },
  plugins: [],
}

