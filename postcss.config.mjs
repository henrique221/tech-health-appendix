import oklabFunction from '@csstools/postcss-oklab-function';

const config = {
  plugins: [
    "tailwindcss",
    "autoprefixer",
    oklabFunction({
      subFeatures: {
        displayP3: false
      }
    })
  ],
};

export default config;
