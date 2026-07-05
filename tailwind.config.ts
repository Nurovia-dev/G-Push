import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // GitHub-inspired palette + brand gradient
        brand: {
          50:  '#f3f1ff',
          100: '#e9e5ff',
          200: '#d5ccff',
          300: '#b3a3ff',
          400: '#8b6dff',
          500: '#6841e6',
          600: '#5b2bd6',
          700: '#4c22b3',
          800: '#3e1d8f',
          900: '#2d1666',
        },
        gh: {
          bg: '#0d1117',
          surface: '#161b22',
          border: '#30363d',
          fg: '#e6edf3',
          muted: '#7d8590',
          accent: '#2f81f7',
          success: '#3fb950',
          warning: '#d29922',
          danger: '#f85149',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica', 'Arial'],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'gradient': 'gradient 8s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        gradient: { '0%, 100%': { 'background-position': '0% 50%' }, '50%': { 'background-position': '100% 50%' } },
      },
    },
  },
  plugins: [],
};

export default config;