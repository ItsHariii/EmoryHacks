/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ovi brand colors — matches app theme.ts
        ovi: {
          primary: '#B84C3F',
          'primary-dark': '#8F3A31',
          'primary-light': '#F4E4DF',
          'primary-soft': 'rgba(184, 76, 63, 0.10)',
          peach: '#FFD6C9',
          'peach-light': '#FFF0E6',
          lavender: '#DCD6FF',
          'lavender-light': '#F2F0FF',
          cream: '#F6F1EA',
          'cream-dark': '#EFE7DC',
          surface: '#FCF8F1',
          border: '#E8DFD2',
          'border-light': '#EFE5D5',
          accent: '#8A9A7B',
          'accent-dark': '#6F8C6F',
          'accent-light': '#E9EEE2',
          gold: '#D19B4E',
          'gold-light': '#F5EAD7',
          text: {
            primary: '#2B221B',
            secondary: '#5A4D42',
            muted: '#8C7E70',
          },
        },
      },
      fontFamily: {
        sans: ['Instrument Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      backgroundImage: {},
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%': { opacity: '0.6' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'shadow-pulse': {
          '0%, 100%': {
            boxShadow: '0 8px 16px -4px rgba(74, 59, 50, 0.12), 0 25px 50px -12px rgba(74, 59, 50, 0.2)',
          },
          '50%': {
            boxShadow: '0 12px 24px -6px rgba(74, 59, 50, 0.1), 0 30px 60px -12px rgba(74, 59, 50, 0.15)',
          },
        },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'shimmer': 'shimmer 2s ease-in-out',
        'shadow-pulse': 'shadow-pulse 4s ease-in-out infinite',
      },
      boxShadow: {
        'ovi-soft': '0 4px 20px rgba(74, 59, 50, 0.08)',
        'ovi-card': '0 4px 16px rgba(74, 59, 50, 0.08)',
        'ovi-glow': '0 0 24px rgba(220, 214, 255, 0.5)',
        'ovi-glow-peach': '0 0 20px rgba(255, 214, 201, 0.4)',
        'ovi-phone': '0 8px 16px -4px rgba(74, 59, 50, 0.12), 0 25px 50px -12px rgba(74, 59, 50, 0.2)',
      },
    },
  },
  plugins: [],
}
