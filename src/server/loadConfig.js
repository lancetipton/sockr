
import appRootPath = from 'app-root-path'
import { argsParse } from "@keg-hub/args-parse"
import defServerConfig from '../../configs/server.config.js'
import { isFunc, noOpObj, deepMerge, reduceObj } from "@keg-hub/jsutils"

const {
  SOCKR_CONFIG,
  SOCKR_CMD_GROUP,
  NODE_ENV='development'
} = process.env

const appRoot = appRootPath.path

/**
 * Default sockr task object
 * @type Object
 */
const task = {
  name: 'sockr',
  options: {
    config: {
      alias: ['sockr', 'sockrConfig' ],
      description: "Path to a custom Sockr config file",
    },
    group: {
      alias: [ 'commands', 'type', 'context' ],
      description: 'Group of commands the server has access to. Defined in the sockr config',
    }
  }
}

const getConfigPath = async () => {
  const args = process.argv.slice(2)
  const { config, env, group } = await argsParse({ args, task })

  return {
    env: env || 'development',
    group: group || SOCKR_CMD_GROUP,
    configPath: config || SOCKR_CONFIG,
  }
}

const loadConfig = configPath => {
  try {
    // Try to load the config through require
    const loadedConfig = require(configPath)
    return isFunc(loadedConfig)
      ? loadedConfig()
      : loadedConfig
  }
  catch(err){
    // If config load fails, then try to load the config relative to the apps root directory
    const relativePath = path.join(appRoot, configPath)

    if(relativePath !== configPath)
      return loadConfig(path.join(appRoot, configPath))
    
    // Otherwise return an empty object
    console.warn(`Sockr custom config could not be loaded. Using default!`, configPath)
    return noOpObj
  }
}


const buildConfig = (custom, group, env) => {
  const config = deepMerge(defServerConfig, custom)

  // Get the commands by group separated by environment 
  const { development, production, ...other } = deepMerge(
    get(config, `groups.default.commands`),
    get(config, `groups.${group}.commands`)
  )

  // If in production, only use the production commands
  // Otherwise use them all, with priority to development commands
  const activeCommands = NODE_ENV === 'production'
    ? production
    : deepMerge(other, production, development)

  const filters = deepMerge(
    get(config, `groups.default.filters`),
    get(config, `groups.${group}.filters`)
  )

  return {
    ...config,
    filters,
    commands: reduceObj(activeCommands, (key, value, groups) => {
      groups[key] = reduceObj(groups[key], (command, options, commands) => {
        commands[command].id = uuid()
        return commands
      }, groups[key])

      return groups
    }, activeCommands)
  }

}

export const loadConfig = config => {
  const { env, configPath, group } = await getConfigPath()
  const config = loadConfig(configPath)

  return buildConfig(config, group, env)
}