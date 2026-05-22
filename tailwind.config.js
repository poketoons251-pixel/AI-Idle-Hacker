/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        cyber: {
          primary: '#00ff41',
          secondary: '#ff0080',
          accent: '#00d4ff',
          warning: '#ffaa00',
          danger: '#ff3366',
          dark: '#0a0a0a',
          darker: '#050505',
          gray: '#1a1a1a',
          'gray-light': '#2a2a2a',
          'gray-lighter': '#3a3a3a',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
        cyber: ['Orbitron', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flicker': 'flicker 0.15s infinite linear',
        'slide-in': 'slideIn 0.3s ease-out forwards',
        'glitch': 'glitch 0.3s ease-in-out',
        'screen-flash': 'screenFlash 0.3s ease-out forwards',
        'scan-sweep': 'scanSweep 2s ease-in-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #00ff41, 0 0 10px #00ff41, 0 0 15px #00ff41' },
          '100%': { boxShadow: '0 0 10px #00ff41, 0 0 20px #00ff41, 0 0 30px #00ff41' },
        },
        flicker: {
          '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': {
            opacity: '0.99',
            filter: 'drop-shadow(0 0 1px rgba(252, 211, 77)) drop-shadow(0 0 15px rgba(245, 101, 101)) drop-shadow(0 0 1px rgba(252, 211, 77))',
          },
          '20%, 21.999%, 63%, 63.999%, 65%, 69.999%': {
            opacity: '0.4',
            filter: 'none',
          },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        glitch: {
          '0%': { transform: 'translate(0)', filter: 'none' },
          '20%': { transform: 'translate(-2px, 1px)', filter: 'hue-rotate(90deg) brightness(1.2)' },
          '40%': { transform: 'translate(2px, -1px)', filter: 'hue-rotate(-90deg) brightness(0.8)' },
          '60%': { transform: 'translate(-1px, 2px)', filter: 'hue-rotate(45deg)' },
          '80%': { transform: 'translate(1px, -2px)', filter: 'hue-rotate(-45deg)' },
          '100%': { transform: 'translate(0)', filter: 'none' },
        },
        screenFlash: {
          '0%': { opacity: '0' },
          '10%': { opacity: '0.15' },
          '30%': { opacity: '0.08' },
          '100%': { opacity: '0' },
        },
        scanSweep: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
