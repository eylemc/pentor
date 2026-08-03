/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#070a0f',
          900: '#0b0f16',
          850: '#0e131c',
          800: '#121826',
          750: '#161d2e',
          700: '#1b2436',
          600: '#283349',
          500: '#3a465f',
        },
        accent: {
          50: '#e8fff4',
          100: '#c7ffe6',
          200: '#8bffd0',
          300: '#4fffb4',
          400: '#1ff09a',
          500: '#06d17f',
          600: '#03a866',
          700: '#048556',
          800: '#096847',
          900: '#0b563d',
        },
        cyber: {
          400: '#38e1ff',
          500: '#0fb8e0',
          600: '#0a8fb8',
        },
        danger: {
          400: '#ff6b6b',
          500: '#ff3b3b',
          600: '#e11d1d',
        },
        warn: {
          400: '#ffb84d',
          500: '#ff9f1c',
          600: '#e08600',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glow-accent': '0 0 0 1px rgba(6,209,127,0.25), 0 0 24px -4px rgba(6,209,127,0.35)',
        'glow-cyber': '0 0 24px -6px rgba(15,184,224,0.4)',
        'card': '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 30px -12px rgba(0,0,0,0.7)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)',
        'radial-fade':
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(6,209,127,0.10), transparent 70%)',
      },
      backgroundSize: {
        'grid-sm': '44px 44px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out both',
        'fade-up': 'fadeUp 0.5s ease-out both',
        'slide-in-right': 'slideInRight 0.3s ease-out both',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'spin-slow': 'spin 1.2s linear infinite',
        'shimmer': 'shimmer 1.6s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
      },
    },
  },
  plugins: [],
};
