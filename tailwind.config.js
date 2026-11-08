/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#060913',
          card: '#0c1222',
          cardHover: '#141e36',
          border: '#1e2d4f',
          blue: '#00e5ff',
          blueDim: '#008ba3',
          purple: '#9d4edd',
          pink: '#f72585',
          green: '#00ff88',
          yellow: '#ffd60a',
          red: '#ff0055',
          orange: '#ff6b35',
        }
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neon-blue': '0 0 15px rgba(0, 229, 255, 0.45)',
        'neon-purple': '0 0 15px rgba(157, 78, 221, 0.45)',
        'neon-red': '0 0 15px rgba(255, 0, 85, 0.45)',
        'neon-green': '0 0 15px rgba(0, 255, 136, 0.45)',
        'neon-yellow': '0 0 15px rgba(255, 214, 10, 0.45)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-scan': 'scanline 8s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
}
