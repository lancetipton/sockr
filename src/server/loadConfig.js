const path = require('path')
const appRootPath = require('app-root-path')
const { argsParse } = require('@keg-hub/args-parse')
const {
  serverConfig: defServerConfig,
} = require('../../configs/server.config.js')
const {
  isFunc,
  get,
  set,
  noOpObj,
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

const getConfigPath = async (options = noOpObj) => {
  const args = Object.entries(options).reduce((optArr, [ key, value ]) => {
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
  const addDefConfig = Boolean(!customConfig && !serverConfig)
  // Extract the groups from the def config, so we don't add the example commands
  const { groups: defGroups, ...sockrConf } = defServerConfig

  const { path: socketPath, host, port, groups, ...config } = deepMerge(
    addDefConfig ? defServerConfig : sockrConf,
    customConfig,
    serverConfig
  )

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

  const builtCmds = reduceObj(
    activeCommands,
    (command, definition, groups) => {
      definition.id = uuid()
      definition.name = definition.name || command
      definition.group = definition.group || group

      set(groups, [ definition.group, command ], definition)

      return groups
    },
    {}
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
    commands: builtCmds,
  }
}

const loadConfig = async (config, cmdGroup) => {
  const { env, configPath, group } = await getConfigPath(config.options)
  const loadedConfig = setupConfig(configPath, config)

  const built = buildConfig(loadedConfig, config, cmdGroup || group, env)

  return built
}

module.exports = {
  loadConfig,
}
