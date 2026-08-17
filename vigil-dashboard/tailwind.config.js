/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'vigil': '#7C3AED',
        'vigil-light': '#A78BFA',
        'vigil-dark': '#5B21B6',
        'baltic-blue': '#2660A4',
        'pale-slate': '#ADB6C4',
        'papaya': 'rgb(var(--color-papaya))',
        'peach-glow': '#FFC49B',
        'dark-charcoal': 'rgb(var(--color-text))',
        'text-secondary': 'rgb(var(--color-text-secondary))',
        'text-muted': 'rgb(var(--color-text-muted))',
        'border-gray': 'rgb(var(--color-border))',
        'success': '#22C55E',
        'danger': '#EF4444',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      borderRadius: { sm: '8px', md: '12px', lg: '16px', xl: '24px', '2xl': '28px' },
      boxShadow: { sm: '0 2px 8px rgba(0,0,0,.05)', md: '0 8px 30px rgba(0,0,0,.08)', lg: '0 16px 60px rgba(0,0,0,.12)' },
      spacing: { 18: '72px', 30: '120px' },
      maxWidth: { app: '1280px' },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: { fadeIn: 'fadeIn 300ms ease', slideUp: 'slideUp 300ms ease-out' },
    },
  },
  plugins: [],
};
