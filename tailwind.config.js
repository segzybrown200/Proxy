/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#004CFF',
          150: '#F8CECE',
          200: '#FFEBEB',
          300: '#F9FAFB',
          400: '#ECF0F4',
        },
        textColor: {
          100: '#202020',
          200: '#A0A5BA',
        },
      },
      fontFamily: {
        RalewayThin: ['Raleway-Thin', 'sans-serif'],
        RalewayExtraLight: ['Raleway-ExtraLight', 'sans-serif'],
        RalewayLight: ['Raleway-Light', 'sans-serif'],
        RalewayRegular: ['Raleway-Regular', 'sans-serif'],
        RalewayMedium: ['Raleway-Medium', 'sans-serif'],
        RalewaySemiBold: ['Raleway-SemiBold', 'sans-serif'],
        RalewayBold: ['Raleway-Bold', 'sans-serif'],
        RalewayExtraBold: ['Raleway-ExtraBold', 'sans-serif'],
        RalewayBlack: ['Raleway-Black', 'sans-serif'],
        NunitoExtraLight: ['Nunito-ExtraLight', 'sans-serif'],
        NunitoLight: ['Nunito-Light', 'sans-serif'],
        NunitoRegular: ['Nunito-Regular', 'sans-serif'],
        NunitoMedium: ['Nunito-Medium', 'sans-serif'],
        NunitoSemiBold: ['Nunito-SemiBold', 'sans-serif'],
        NunitoBold: ['Nunito-Bold', 'sans-serif'],
        NunitoExtraBold: ['Nunito-ExtraBold', 'sans-serif'],
        NunitoBlack: ['Nunito-Black', 'sans-serif'],
      },
    },
  },
};