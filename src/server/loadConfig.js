const path = require('path')
const appRootPath = require('app-root-path')
const { argsParse } = require('@keg-hub/args-parse')
const {
  serverConfig: defServerConfig,
} = require('../../configs/server.config.js')
const {
  isFunc,
  get,
  noOpObj,
  noPropArr,
  deepMerge,
  reduceObj,
  uuid,
} = require('@keg-hub/jsutils')

const { SOCKR_CONFIG, SOCKR_CMD_GROUP, NODE_ENV = 'development' } = process.env

const appRoot = appRootPath.path

/**
 * Default sockr task object
 * @type Object
 */
const task = {
  name: 'sockr',
  options: {
    config: {
      alias: [ 'sockr', 'sockrConfig' ],
      description: 'Path to a custom Sockr config file',
    },
    group: {
      alias: [ 'commands', 'type', 'context' ],
      description:
        'Group of commands the server has access to. Defined in the sockr config',
    },
  },
}

const getConfigPath = async (options=noOpObj) => {
  const args = Object.entries(options)
    .reduce((optArr, [key, value]) => {
      optArr.push(`${key}=${value}`)
      return optArr
    }, process.argv.slice(2))

  const { config, env, group } = await argsParse({ args, task })

  return {
    env: env || 'development',
    group: group || SOCKR_CMD_GROUP,
    configPath: config || SOCKR_CONFIG,
  }
}

const setupConfig = (configPath, serverConfig) => {
  try {
    // Try to load the config through require
    const loadedConfig = require(configPath)
    return isFunc(loadedConfig) ? loadedConfig() : loadedConfig
  }
  catch (err) {
    // If config load fails, then try to load the config relative to the apps root directory
    const relativePath = configPath && path.join(appRoot, configPath)

    if (relativePath !== configPath)
      return setupConfig(path.join(appRoot, configPath))

    // Otherwise return an empty object
    !serverConfig &&
      console.warn(
        `Sockr custom config could not be loaded. Using default!`,
        configPath
      )

    return noOpObj
  }
}

const buildConfig = (customConfig, serverConfig, group, env) => {

  const {
    path:socketPath,
    host,
    port,
    groups,
    ...config
  } = deepMerge(defServerConfig, customConfig, serverConfig)

  // Get the commands by group separated by environment
  const { development, production, ...other } = deepMerge(
    get(groups, `default.commands`),
    get(groups, `${group}.commands`)
  )

  // If in production, only use the production commands
  // Otherwise use them all, with priority to development commands
  const activeCommands =
    NODE_ENV === 'production'
      ? production
      : deepMerge(other, production, development)

  const filters = deepMerge(
    get(groups, `default.filters`),
    get(groups, `${group}.filters`)
  )

  return {
    ...config,
    process: config.process,
    socket: {
      port,
      host,
      path: socketPath,
    },
    filters,
    commands: reduceObj(
      activeCommands,
      (key, value, groups) => {
        groups[key] = reduceObj(
          groups[key],
          (command, options, commands) => {
            commands[command].id = uuid()
            return commands
          },
          groups[key]
        )

        return groups
      },
      activeCommands
    ),
  }
}

const loadConfig = async config => {
  const { env, configPath, group } = await getConfigPath(config.options)
  const loadedConfig = setupConfig(configPath, config)

  const built = buildConfig(loadedConfig, config, group, env)

  return built
}

module.exports = {
  loadConfig,
}
