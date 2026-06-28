/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,ts,jsx,tsx}',
    './index.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Warm charcoal background ramp
        'bg-0': '#0B0A09',
        'bg-1': '#131110',
        'bg-2': '#1C1917',
        'bg-3': '#262220',
        'bg-line': '#34302B',
        // Watch metal
        'brass-dim': '#6B5836',
        'brass-base': '#A8854E',
        'brass-hi': '#D4B074',
        // Signature lume
        'lume-rest': '#C9BE82',
        'lume-glow': '#E8DBA0',
        // Text
        'text-primary': '#ECE3D2',
        'text-secondary': '#A99C84',
        'text-muted': '#6C6353',
      },
      fontFamily: {
        display: ['SpaceGrotesk'],
        mono: ['SpaceMono'],
      },
      fontSize: {
        caption: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['20px', { lineHeight: '28px' }],
        xl: ['28px', { lineHeight: '36px' }],
        preset: ['18px', { lineHeight: '24px' }],
        dial: ['128px', { lineHeight: '128px' }],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
      borderRadius: {
        sm: '8px',
        md: '16px',
        lg: '24px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
