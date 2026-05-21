import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // App surfaces
        bg:      '#0D0D14',
        surface: '#16161F',
        'surface-2': '#1E1E2A',
        'surface-3': '#26263A',
        border:  '#2A2A3D',

        // Primary accent — violet/purple
        primary: {
          DEFAULT: '#7C3AED',
          light:   '#8B5CF6',
          dark:    '#6D28D9',
        },

        // Ludo player colors
        ludo: {
          red:    '#E53E3E',
          blue:   '#3182CE',
          green:  '#38A169',
          yellow: '#D69E2E',
        },

        // Semantic
        coin:    '#F59E0B',
        online:  '#10B981',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)',
        glow: '0 0 20px rgba(124,58,237,0.35)',
        'glow-sm': '0 0 10px rgba(124,58,237,0.25)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;
