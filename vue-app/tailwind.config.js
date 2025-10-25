/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4a69bd',
        accent: '#ffb85c',
        'bg-start': '#fdd99d',
        'bg-end': '#ffb85c',
        'text-light': '#333',
        'text-dark': '#8B4513',
        'form-bg': '#f5deb3',
        'form-highlight': '#faebd7',
        'form-focus': '#fff8dc',
      },
      boxShadow: {
        strong: '0 4px 10px rgba(0, 0, 0, 0.15)',
        active: '0 2px 4px rgba(0, 0, 0, 0.2)',
        hover: '0 6px 15px rgba(0, 0, 0, 0.2)',
        'glow-orange': '0 0 30px rgba(255, 184, 92, 0.8)',
      },
      borderRadius: {
        'xl-custom': '24px',
      },
      height: {
        '70vh': '70vh',
        '80vh': '80vh',
      },
      maxHeight: {
        '70vh': '70vh',
      },
      spacing: {
        '15': '3.75rem',
        '7.5': '30px',
      },
      width: {
        '500px': '500px',
      },
      maxWidth: {
        '500px': '500px',
      },
      inset: {
        '7.5': '30px',
      },
      zIndex: {
        '1': '1',
        '5': '5',
        '50': '50',
        '200': '200',
        '1000': '1000',
      },
    },
  },
  plugins: [],
}
