/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ovi brand colors from app theme
        ovi: {
          primary: '#D65A5A',
          'primary-dark': '#B04040',
          'primary-light': '#FF8F8F',
          'primary-soft': 'rgba(214, 90, 90, 0.1)',
          peach: '#FFD6C9',
          'peach-light': '#FFF0E6',
          lavender: '#DCD6FF',
          'lavender-light': '#F2F0FF',
          cream: '#FFF5F2',
          'cream-dark': '#F9EBE6',
          surface: '#FFFFFF',
          border: '#F0E6E0',
          'border-light': '#F7F0EB',
          accent: '#A8D5BA',
          'accent-dark': '#86B396',
          'accent-light': '#E8F5EC',
          gold: '#FFE5A0',
          text: {
            primary: '#4A3B32',
            secondary: '#8C7B70',
            muted: '#B0A096',
          },
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
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
