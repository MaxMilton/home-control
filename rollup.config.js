import compiler from '@ampproject/rollup-plugin-closure-compiler';
import { gitDescribe, postcss, preMarkup, preStyle } from 'minna-ui';
// import path from 'path';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript';
import config from 'sapper/config/rollup.js';
import pkg from './package.json';

const mode = process.env.NODE_ENV;
const dev = mode === 'development';

const appRelease = gitDescribe();

const postcssOpts = {
  include: ['src/css/**/*.css'],
};

/** Svelte preprocessors */
const preprocess = {
  markup: preMarkup({ level: dev ? 0 : 3 }),
  style: preStyle(),
};

// FIXME: Replace terser with closure compiler once it supports import correctly
const nameCache = {};
const terserOpts = {
  nameCache,
  ecma: 8,
  module: true,
  numWorkers: 1,
  toplevel: true,
};

export default {
  client: {
    input: config.client.input(),
    output: config.client.output(),
    plugins: [
      replace({
        'process.browser': true,
        'process.env.GIT_RELEASE': JSON.stringify(appRelease),
        'process.env.NODE_ENV': JSON.stringify(mode),
      }),
      postcss(postcssOpts),
      svelte({
        dev,
        preprocess,
        emitCss: true,
        hydratable: true,
      }),
      resolve(),
      commonjs(),
      typescript({
        typescript: require('typescript'), // eslint-disable-line global-require
      }),

      // FIXME: Replace terser with closure compiler once it supports import correctly
      !dev && terser(terserOpts),
      // TODO: Use ADVANCED mode once dynamic import is supported https://git.io/fxwrR
      // FIXME: Breaks export; wait until fixed upstream; or may be something related to ts
      // !dev &&
      //   compiler({
      //     // externs: [
      //     //   require.resolve('google-closure-compiler/contrib/externs/svg.js'),
      //     //   path.join(__dirname, 'externs.js'),
      //     // ],

      //     // charset: 'UTF-8',
      //     compilation_level: 'SIMPLE',
      //     // compilation_level: 'ADVANCED',
      //     // jscomp_off: '*', // FIXME: Svelte errors
      //   }),
    ],

    // temporary, pending Rollup 1.0
    experimentalCodeSplitting: true,
  },

  server: {
    input: config.server.input(),
    output: config.server.output(),
    plugins: [
      replace({
        'process.browser': false,
        'process.env.GIT_RELEASE': JSON.stringify(appRelease),
        'process.env.NODE_ENV': JSON.stringify(mode),
      }),
      postcss(postcssOpts),
      svelte({
        dev,
        preprocess,
        generate: 'ssr',
      }),
      resolve(),
      commonjs(),
      typescript({
        typescript: require('typescript'), // eslint-disable-line global-require
      }),
    ],
    external: Object.keys(pkg.dependencies) // tslint:disable-line object-literal-sort-keys
      .filter(dep => !/^@minna-ui/.test(dep)) // minna-ui packages in dependencies
      .concat(require('module').builtinModules), // eslint-disable-line global-require

    // temporary, pending Rollup 1.0
    experimentalCodeSplitting: true,
  },

  serviceworker: {
    input: config.serviceworker.input(),
    output: config.serviceworker.output(),
    plugins: [
      replace({
        'process.browser': true,
        'process.env.NODE_ENV': JSON.stringify(mode),
      }),
      resolve(),
      commonjs(),

      !dev &&
        compiler({
          compilation_level: 'ADVANCED',
        }),
    ],
  },
};
