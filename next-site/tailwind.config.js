/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: 'hsl(var(--color-surface))',
        text: 'hsl(var(--color-text))',
        muted: 'hsl(var(--color-muted))',
        accent: 'hsl(var(--color-accent))',
        border: 'hsl(var(--color-border))',
      },
      borderRadius: {
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
      },
    },
  },
  plugins: [],
}
