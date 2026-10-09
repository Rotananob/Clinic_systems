/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Kantumruy Pro', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        khmer: ['Kantumruy Pro', 'sans-serif'],
      },
      colors: {
        milk: {
          canvas: '#F7F4EE',
          surface: '#FDFBF7',
          card: '#FAF7F2',
          subtle: '#F1ECE1',
          border: '#E7E1D4',
          borderLight: '#EFEAE0',
          espresso: '#231F1C',
          taupe: '#78716C',
          accent: '#A16207',
        },
        clinical: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          900: '#134e4a',
        },
      },
    },
  },
  plugins: [],
};
