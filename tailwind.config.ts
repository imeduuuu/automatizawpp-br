import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#ffffff',
        brandSlate: '#111111',
        muted: '#888888',
        surface: '#080808',
        success: '#198754',
        warn: '#d97706',
        danger: '#dc2626',
        accent: '#25D366'
      },
      boxShadow: {
        soft: '0 12px 28px rgba(0, 0, 0, 0.35)'
      }
    }
  },
  plugins: []
};

export default config;
