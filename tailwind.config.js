/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: {
          white: 'rgba(255,255,255,0.05)',
          border: 'rgba(255,255,255,0.1)',
          hover: 'rgba(255,255,255,0.08)',
        },
        brand: {
          primary: '#00d4ff',
          secondary: '#7b2fff',
          accent: '#ff6b35',
          green: '#00e676',
          red: '#ff1744',
          gold: '#ffd700',
        },
        dark: {
          900: '#030712',
          800: '#060e1e',
          700: '#0a1628',
          600: '#0f1f38',
          500: '#152848',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #030712 0%, #060e1e 40%, #0a0520 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        'neon-gradient': 'linear-gradient(135deg, #00d4ff, #7b2fff)',
        'gold-gradient': 'linear-gradient(135deg, #ffd700, #ff8c00)',
        'green-gradient': 'linear-gradient(135deg, #00e676, #00b248)',
        'red-gradient': 'linear-gradient(135deg, #ff1744, #c40031)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        neon: '0 0 20px rgba(0,212,255,0.3), 0 0 40px rgba(0,212,255,0.15)',
        'neon-purple': '0 0 20px rgba(123,47,255,0.4), 0 0 40px rgba(123,47,255,0.2)',
        'neon-green': '0 0 15px rgba(0,230,118,0.4)',
        'neon-red': '0 0 15px rgba(255,23,68,0.4)',
        card: '0 4px 24px rgba(0,0,0,0.5)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Helvetica Neue', 'sans-serif'],
        mono: ['Inter', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'ticker': 'ticker 30s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          from: { boxShadow: '0 0 5px rgba(0,212,255,0.2)' },
          to: { boxShadow: '0 0 20px rgba(0,212,255,0.6), 0 0 40px rgba(0,212,255,0.3)' },
        },
        ticker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
};
