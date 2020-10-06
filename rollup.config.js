import nodeResolve from '@rollup/plugin-node-resolve';
import excludeDependenciesFromBundle from 'rollup-plugin-exclude-dependencies-from-bundle';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import replace from 'rollup-plugin-replace';
import filesize from 'rollup-plugin-filesize';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';
const destinationDirectory = 'lib';
const destinationFileName = 'bundle';
const INPUT_FILE_PATH = 'src/index.js';
const OUTPUT_NAME = 'phoenixToRedux';

const makeExternalPredicate = (externalArr) => {
  if (!externalArr.length) {
    return () => false;
  }
  const pattern = new RegExp(`^(${externalArr.join('|')})($|/)`);
  return (id) => pattern.test(id);
};

const deps = Object.keys(pkg.dependencies || {});
const peerDeps = Object.keys(pkg.peerDependencies || {});

const GLOBALS = makeExternalPredicate(deps.concat(peerDeps));

const createConfig = ({ input, output, external, env }) => ({
  input,
  output: {
    sourcemap: true,
    name: OUTPUT_NAME,
    globals: GLOBALS,
    ...output,
  },
  external: makeExternalPredicate(external === 'peers' ? peerDeps : deps.concat(peerDeps)),
  plugins: [
    excludeDependenciesFromBundle({ peerDependencies: true, dependencies: true }),
    env === 'production' && terser(),
    commonjs(),
    filesize(),
    nodeResolve({
      jsnext: true,
    }),
    babel({
      babelrc: false, // to ignore @babel/transform-runtime
      exclude: 'node_modules/**',
      presets: ['@babel/env'],
      babelHelpers: 'bundled',
    }),
    env &&
      replace({
        'process.env.NODE_ENV': JSON.stringify(env),
      }),
  ],
  onwarn(warning, warn) {
    if (warning.code === 'UNUSED_EXTERNAL_IMPORT') {
      return;
    }
    warn(warning);
  },
});

export default [
  createConfig({
    input: INPUT_FILE_PATH,
    output: {
      file: `${destinationDirectory}/${destinationFileName}.dev.esm.js`,
      format: 'es',
    },
    env: 'development',
  }),
  createConfig({
    input: INPUT_FILE_PATH,
    output: {
      file: pkg.module,
      format: 'es',
    },
    env: 'production',
  }),
  createConfig({
    input: INPUT_FILE_PATH,
    output: {
      file: pkg.main,
      format: 'cjs',
    },
    env: 'production',
  }),
  createConfig({
    input: INPUT_FILE_PATH,
    output: {
      format: 'cjs',
      file: `${destinationDirectory}/${destinationFileName}.dev.cjs.js`,
    },
    env: 'development',
  }),
];
