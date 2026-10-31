/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts,scss}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        surface: {
          50: '#fcfcfd',
          100: '#f4f4f6',
          200: '#e4e4e9',
          300: '#d1d1db',
          400: '#9e9eb0',
          500: '#717184',
          600: '#525264',
          700: '#3a3a49',
          800: '#242531',
          850: '#191a24',
          900: '#12131c',
          950: '#0a0b10',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'subtle-dark': '0 0 0 1px rgba(255,255,255,0.06), 0 1px 2px 0 rgba(0,0,0,0.4)',
        'elevated-dark': '0 0 0 1px rgba(255,255,255,0.08), 0 8px 24px -4px rgba(0,0,0,0.6)',
        'subtle-light': '0 0 0 1px rgba(0,0,0,0.05), 0 1px 2px 0 rgba(0,0,0,0.05)',
        'elevated-light': '0 0 0 1px rgba(0,0,0,0.08), 0 8px 24px -4px rgba(0,0,0,0.1)',
      }
    },
  },
  plugins: [],
}
