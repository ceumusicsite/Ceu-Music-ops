import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          teal: '#10767c',
          brown: '#925938',
          dark: '#7c3315',
          light: '#967a70',
        },
        dark: {
          bg: '#0a0a0a',
          card: '#1a1a1a',
          border: '#2a2a2a',
          hover: '#252525',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #10767c 0%, #925938 50%, #7c3315 75%, #967a70 100%)',
        'gradient-hover': 'linear-gradient(135deg, #10767c 0%, #925938 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config