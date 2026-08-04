/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#fcf0f3',
          100: '#fdf8f9',
          200: '#f2e3e6',
          300: '#e5cbd1',
          600: '#a31545',
          700: '#800020',
          800: '#5c0017',
          900: '#1a0509',
        },
      },
      boxShadow: {
        'maroon-sm': '0 1px 3px rgba(128, 0, 32, 0.08)',
        'maroon-md': '0 4px 12px rgba(128, 0, 32, 0.1)',
        'maroon-lg': '0 10px 25px rgba(128, 0, 32, 0.12)',
      },
      borderRadius: {
        DEFAULT: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '0px',
      },
    },
  },
  plugins: [],
};
