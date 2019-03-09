/* eslint-disable @typescript-eslint/camelcase, global-require */

import compiler from '@ampproject/rollup-plugin-closure-compiler';
import { gitDescribe, postcss, preMarkup, preStyle } from 'minna-ui';
// import path from 'path';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import svelte from 'rollup-plugin-svelte';
// import { terser } from 'rollup-plugin-terser';
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
  markup: preMarkup(),
  style: preStyle(),
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
        emitCss: true,
        hydratable: true,
        preprocess,
      }),
      resolve(),
      commonjs({
        extensions: ['.mjs', '.js', '.svelte'],
        include: ['node_modules/**'],
      }),
      typescript({
        typescript: require('typescript'),
      }),

      // FIXME: Replace terser with closure compiler once it supports `import`
      // !dev &&
      //   terser({
      //     ecma: 8,
      //     module: true,
      //   }),
      !dev &&
        compiler({
          // externs: [
          //   require.resolve('google-closure-compiler/contrib/externs/svg.js'),
          //   path.join(__dirname, 'externs.js'),
          // ],

          // charset: 'UTF-8',
          compilation_level: 'SIMPLE',
          // compilation_level: 'ADVANCED',
          // jscomp_off: '*', // FIXME: Svelte errors
        }),
    ],
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
        css: false, // ????
        dev,
        generate: 'ssr',
        preprocess,
      }),
      resolve(),
      commonjs({
        extensions: ['.mjs', '.js', '.svelte'],
        include: ['node_modules/**'],
      }),
      typescript({
        typescript: require('typescript'),
      }),
    ],
    // eslint-disable-next-line sort-keys
    external: Object.keys(pkg.dependencies)
      .filter((dep) => !/^@minna-ui/.test(dep)) // minna-ui packages in dependencies
      .concat(require('module').builtinModules),
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
      commonjs({
        extensions: ['.mjs', '.js', '.svelte'],
        include: ['node_modules/**'],
      }),
      typescript({
        typescript: require('typescript'),
      }),

      !dev &&
        compiler({
          compilation_level: 'ADVANCED',
        }),
    ],
  },
};
