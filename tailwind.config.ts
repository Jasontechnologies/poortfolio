import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          lemon: '#b8e35a',
          ink: '#111111',
          paper: '#ffffff'
        }
      }
    }
  },
  plugins: []
};

export default config;
