import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#080c1a',
          900: '#0b1020',
          800: '#131a33',
          700: '#1d2647',
          600: '#2a3357',
        },
        beam: {
          400: '#7aa2ff',
          500: '#5b86f5',
          600: '#3f66d6',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
