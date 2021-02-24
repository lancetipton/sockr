import { babel } from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import cleanup from 'rollup-plugin-cleanup'
import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import { join } from 'path'

const { DOC_APP_PATH } = process.env
const clientOutputDir = Boolean(DOC_APP_PATH)
  ? join(
      __dirname,
      `../../../../../node_modules/@ltipton/sockr/build/client/esm`
    )
  : 'build/client/esm'

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
    external: ['react'],
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
