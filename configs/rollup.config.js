import { babel } from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import cleanup from 'rollup-plugin-cleanup'
import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import { exec } from 'child_process'
import { promisify } from 'util'

const cmdExec = promisify(exec)

const { DOC_APP_PATH } = process.env
const inDocker = Boolean(DOC_APP_PATH)
const isProd = process.env.NODE_ENV === 'production'

const clientOutputDir = 'build/client/esm'
const shared = config => {
  return {
    plugins: [
      babel({ babelHelpers: 'bundled' }),
      resolve(config.resolve),
      commonjs(),
      json(),
      cleanup(),
    ],
  }
}

const configs = {
  server: {
    external: [],
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
    external: ['react', 'socket.io-client', 'socket.io', '@keg-hub/jsutils'],
    input: 'src/client/index.js',
    output: [
      {
        dir: `./build/client`,
        format: 'cjs',
        sourcemap: true,
      },
      {
        dir: clientOutputDir,
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
    },
  },
}

const builds = ['client']
export default builds.map(type => {
  return {
    ...configs[type],
    ...shared(pluginConfig[type]),
  }
})
