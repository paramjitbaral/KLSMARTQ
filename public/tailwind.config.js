tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontFamily: {
        sora: ["Sora", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: '#0D47A1', // Dark Blue
          light: '#1976D2',
          dark: '#0D47A1',
        },
        secondary: {
          DEFAULT: '#FFC107', // Amber
          dark: '#FFA000',
        },
        accent: '#4CAF50', // Green
        neutral: {
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
      }
    }
  }
};
