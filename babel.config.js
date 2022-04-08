/* eslint-disable prettier/prettier */
module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
  ],
  plugins: [
    'no-side-effect-class-properties',
    ['@babel/plugin-proposal-class-properties'],
    ['babel-plugin-transform-async-to-promises', { inlineHelpers: true }],
  ],
};
