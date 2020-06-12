import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
const destinationDirectory = 'lib';
const destinationFileName = 'bundle';

const input = 'src/index.js';
const extensions = ['.js'];
const globals = {
  lodash: 'lodash',
  phoenix: 'phoenix',
  reselect: 'reselect',
};
const external = Object.keys(globals);
const output = {
  globals,
  name: 'phoenixToRedux',
};
const babelOptions = {
  extensions,
  babelrc: false, // to ignore @babel/transform-runtime
  exclude: 'node_modules/**',
  presets: ['@babel/env'],
  babelHelpers: 'bundled',
};

export default [
  {
    input,
    external,
    plugins: [
      commonjs(),
      resolve({
        extensions,
        // pass custom options to the resolve plugin
        customResolveOptions: {
          moduleDirectory: 'node_modules',
        },
      }),
      babel({
        ...babelOptions,
      }),
    ],
    output: {
      ...output,
      format: 'cjs',
      file: `${destinationDirectory}/${destinationFileName}.cjs.js`,
    },
  },
  {
    input,
    external,
    plugins: [
      terser(),
      commonjs(),
      resolve({
        extensions,
        // pass custom options to the resolve plugin
        customResolveOptions: {
          moduleDirectory: 'node_modules',
        },
      }),
      babel({
        ...babelOptions,
      }),
    ],
    output: {
      ...output,
      format: 'cjs',
      file: `${destinationDirectory}/${destinationFileName}.cjs.min.js`,
    },
  },
  {
    input,
    external,
    plugins: [
      commonjs(),
      resolve({
        extensions,
        // pass custom options to the resolve plugin
        customResolveOptions: {
          moduleDirectory: 'node_modules',
        },
      }),
      babel({
        ...babelOptions,
      }),
    ],
    output: {
      ...output,
      format: 'esm',
      file: `${destinationDirectory}/${destinationFileName}.esm.js`,
    },
  },
  {
    input,
    external,
    plugins: [
      terser(),
      commonjs(),
      resolve({
        extensions,
        // pass custom options to the resolve plugin
        customResolveOptions: {
          moduleDirectory: 'node_modules',
        },
      }),
      babel({
        ...babelOptions,
      }),
    ],
    output: {
      ...output,
      format: 'esm',
      file: `${destinationDirectory}/${destinationFileName}.esm.min.js`,
    },
  },
  {
    input,
    external,
    plugins: [
      commonjs(),
      resolve({
        extensions,
        // pass custom options to the resolve plugin
        customResolveOptions: {
          moduleDirectory: 'node_modules',
        },
      }),
      babel({
        ...babelOptions,
      }),
    ],
    output: {
      ...output,
      format: 'umd',
      file: `${destinationDirectory}/${destinationFileName}.umd.js`,
    },
  },
  {
    input,
    external,
    plugins: [
      terser(),
      commonjs(),
      resolve({
        extensions,
        // pass custom options to the resolve plugin
        customResolveOptions: {
          moduleDirectory: 'node_modules',
        },
      }),
      babel({
        ...babelOptions,
      }),
    ],
    output: {
      ...output,
      format: 'umd',
      file: `${destinationDirectory}/${destinationFileName}.umd.min.js`,
    },
  },
];
