import { babel } from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import cleanup from 'rollup-plugin-cleanup'
import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import globals from 'rollup-plugin-node-globals'
import builtins from 'rollup-plugin-node-builtins'

const shared = config => {
  return {
    plugins: [
      babel({ babelHelpers: 'bundled' }),
      resolve(config.resolve),
      commonjs(),
      json(),
      // globals(),
      // builtins(),
      cleanup(),
    ],
  }
}

const configs = {
  server: {
    external: [
      'fs',
      'util',
      'http',
      'punycode',
      'querystring',
      'process',
      'events',
      'path',
      'socket.io',
      'readline',
      'stream',
      'assert',
      'child_process',
      'crypto',
      'os',
      'tty',
      'buffer',
      'string_decoder',
      'module',
      '@keg-hub/spawn-cmd',
      'lodash'
    ],
    input: 'src/server/setup.js',
    output: [
      {
        format: 'cjs',
        sourcemap: false,
        file: './build/server/index.js',
      },
    ],
  },
  client: {
    external: [],
    input: 'src/client/index.js',
    output: [
      {
        dir: `./build/client`,
        format: 'cjs',
        sourcemap: true,
      },
      {
        dir: 'build/client/esm',
        format: 'esm',
        sourcemap: true,
      },
    ],
  },
}

const pluginConfig = {
  server: {
    resolve: {
      preferBuiltins: true,
    },
  },
  client: {
    resolve: {
      browser: true,
      preferBuiltins: true,
    },
  },
}

const builds = ['client']
// const builds = ['server', 'client']
export default builds.map(type => {
  return {
    ...configs[type],
    ...shared(pluginConfig[type]),
  }
})
