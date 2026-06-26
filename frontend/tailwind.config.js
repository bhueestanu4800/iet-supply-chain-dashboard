/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background scheme
        background: {
          dark: '#020617', // slate-950
          DEFAULT: '#0f172a', // slate-900
        },
        // Interactive layouts
        brand: {
          navy: '#0b132b', // deep navy
          navyLight: '#1c2541',
          steel: '#4682b4', // steel blue
          steelLight: '#5f9ea0',
        },
        // Industrial status indicators
        status: {
          optimal: '#10b981', // Emerald Green (optimal performance)
          caution: '#f59e0b', // Amber (cautionary threshold)
          critical: '#ef4444', // Crimson Red (critical systemic failure)
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
