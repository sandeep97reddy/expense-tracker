// tailwind.config.js — NativeWind theme configuration
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Primary brand palette (teal)
        primary: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
        // Neutral grays
        surface: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        // Semantic colors
        success: {
          light: '#10B981',
          DEFAULT: '#059669',
          dark: '#047857',
        },
        warning: {
          light: '#F59E0B',
          DEFAULT: '#D97706',
          dark: '#B45309',
        },
        error: {
          light: '#EF4444',
          DEFAULT: '#DC2626',
          dark: '#B91C1C',
        },
        info: {
          light: '#3B82F6',
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
        },
        // Income / Expense semantic
        income: '#10B981',
        expense: '#EF4444',
        transfer: '#8B5CF6',
      },
      fontFamily: {
        sans: ['System'],
        mono: ['SpaceMono'],
      },
      spacing: {
        '4.5': '18px',
        '13': '52px',
        '15': '60px',
        '18': '72px',
        '22': '88px',
      },
      borderRadius: {
        '4xl': '32px',
      },
    },
  },
  plugins: [],
};
