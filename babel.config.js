/* eslint-disable prettier/prettier */
module.exports = {
  presets: [
    '@babel/preset-env',
  ],
  plugins: [
    'no-side-effect-class-properties',
    ['@babel/plugin-proposal-class-properties'],
    'babel-plugin-minify-dead-code-elimination',
    ['babel-plugin-transform-async-to-promises', { inlineHelpers: true }],
  ],
};
