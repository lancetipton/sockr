import { babel } from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import cleanup from 'rollup-plugin-cleanup'
import resolve from '@rollup/plugin-node-resolve'

const shared = () => {
  return {
    plugins: [
      resolve(),
      commonjs(),
      babel({ babelHelpers: 'bundled' }),
      cleanup(),
    ],
  }
}

const configs = {
  server: {
    external: ['fs', 'path', 'socket.io', '@keg-hub/spawn-cmd'],
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

export default Array.from(['server', 'client']).map(type => {
  return {
    ...configs[type],
    ...shared(type),
  }
})
