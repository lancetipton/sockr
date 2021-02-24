const { EventTypes } = require('../../constants')
const {
  get,
  exists,
  noOpObj,
  noPropArr,
  isEmptyColl,
} = require('@keg-hub/jsutils')

const CWD_REGEX = /^(\-\-)?(location|loc|workdir|cwd)\s/

/**
 * Checks if a message should be filtered out, and not sent to the frontend
 * @function
 * @public
 * @export
 *
 * @param {Object} args - Arguments to check if a message should be filtered
 * @param {Object} args.filters - Strings that define what message should be filtered
 * @param {Object} args.data - Message content that is checked for filtering
 * @param {Object} args.group - Group the message is tied to
 * @param {Object} args.cmd - Cmd being run that cause the message to be printed
 *
 * @returns {boolean} True if the message should be filtered
 */
const shouldFilterMessage = args => {
  const { filters, data, group, cmd, commands } = args

  if (!exists(data) || data === '') return true

  const toFilter = [
    ...filters.all,
    ...get(filters, [group], []),
    ...get(filters, [cmd], []),
    ...get(commands, [ group, cmd, 'filters' ], []),
  ]

  return toFilter.reduce(
    (shouldFilter, filter) =>
      shouldFilter || new RegExp(filter, 'gi').test(data),
    false
  )
}

/**
 * Adds the process instance config options to the command
 * @function
 * @public
 * @export
 * @param {Object} config - Process instance config options
 * @param {string} cmd - Command to be run
 * @param {Array} params - Arguments to pass to the command
 *
 * @returns {Array} Arguments to pass to the child exec method
 */
const addConfig = (
  cmd,
  params = noPropArr,
  config = noOpObj,
  events = noOpObj
) => {
  const defCmd = get(config, 'command.default', '/bin/bash')
  const cmdOverrides = get(config, 'command.overrides', noPropArr)

  let cwd = get(config, 'root', process.cwd())
  params.map(param => {
    // Set the current working directory when a param matches
    CWD_REGEX.test(param.trim()) && (cwd = param.match(CWD_REGEX)[3].trim())
  })

  // Add the callback events to the exec options
  // This allows us to capture the commands output
  const execOpts = { ...config.exec, ...events }

  // If the command is in the overrides
  // That means we should call it directly,
  // So just return the array with cmd and params
  // The config command, and script are bypassed
  if (cmdOverrides.includes(cmd)) return [ cmd, params, execOpts, cwd ]

  // Add the cmd as the first argument to the script
  const scriptParams = [ cmd, ...params ]

  // Add the default script to be run
  config.script && scriptParams.unshift(config.script)

  // Returns an array with the default command, and updated params
  return [ defCmd, params, execOpts, cwd ]
}

/**
 * Logs a message when an invalid command is attempting to be run
 * @function
 * @private
 * @param {Object} message - Object sent from the client attempting to run a command
 * @param {Object} manager - SocketManager instance
 *
 * @returns {Object} empty object
 */
const onInvalidCmd = (message, manager) => {
  const { name, cmd, id, params, group } = message

  // Log the invalid command attempt
  console.error('---------- Invalid command ----------')
  console.error(`group: ${group}`)
  console.error(`name: ${name}`)
  console.error(`cmd: ${cmd}`)
  console.error(`id: ${id}`)
  console.error(`params: ${params.join(' ')}`)
  console.error('---------- Invalid command ----------')

  // Update manager, and emit a command failed event
  manager.isRunning = false
  manager.emitAll(EventTypes.CMD_FAIL, {
    name,
    error: true,
    isRunning: manager.isRunning,
    message: 'Failed to run command!',
  })

  // Return an empty object
  return noOpObj
}

/**
 * Validates the a command is allowed to be run
 * @function
 * @public
 * @export
 * @param {Object} message - Object sent from the client attempting to run a command
 * @param {Object} manager - SocketManager instance
 * @param {Object} config - Process instance config
 *
 * @returns {Object} message object is command is valid, or empty object if it is not
 */
const validateCmd = (message, commands, manager, config) => {
  // If the allowedCmds array is not set, or it's empty, the ALLOW ALL COMMANDS
  // Which means we default to allow any command to be run
  // This is dangerous, but also allow full customization
  if (!exists(commands) || isEmptyColl(commands)) return message

  const { name, cmd, id, group } = message

  // Find the command from the group and name
  // The group and name are defined in the command.config as parent properties
  const command = get(commands, [ group, name ])

  // Check if the command is valid, and matches the id that was originally sent to the client
  return !command || command.cmd.indexOf(cmd) !== 0 || !id || id !== command.id
    ? onInvalidCmd(message, manager)
    : message
}

module.exports = {
  addConfig,
  onInvalidCmd,
  shouldFilterMessage,
  validateCmd,
}
