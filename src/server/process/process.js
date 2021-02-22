import path from 'path'
import { exec } from './exec'
import { rootDir } from 'SRootPath'
import { Manager } from '../manager'
import { EventTypes } from '../../constants'
import { shouldFilterMessage, validateCmd, addConfig } from './helpers'
import { deepMerge, noOpObj } from '@keg-hub/jsutils'

/**
 * Class for managing child process run from a socket connection
 * Captures the child process output, and forwards them to the connected sockets
 * @class
 * @public
 * @export
 * @param {Object} commands - Commands that can be run by the Process class instance
 * @param {Object} filters - Text filters the filter out messages sent to connected sockets
 * @param {Object} config - Settings for how commands are run
 *
 * @returns {Object} - Process class instance
 */
export class Process {
  config = {
    command: {
      default: '/bin/bash',
      overrides: [],
    },
    exec: noOpObj,
    root: process.cwd(),
    script: path.join(rootDir, `./scripts/exec.sh`),
  }

  constructor(commands, filters, config) {
    this.commands = commands
    this.filters = filters
    this.manager = config.manager || Manager
    this.config = deepMerge(this.config, config)
  }

  /**
   * Helper to filter message sent from a child process
   * @memberof Process
   * @alias instance&period;filterMessage
   * @function
   * @public
   * @param {string} data - Output of the running process to be emitted
   * @param {string} group - Group the message is tied to
   * @param {string} name - Name of the command that was run and caused the output
   *
   * @returns {boolean} - If the data should be filtered
   */
  filterMessage = (data, group, name) =>
    shouldFilterMessage({
      cmd,
      group,
      data: data.trim(),
      filters: this.filters,
      commands: this.commands,
    })

  /**
   * Callback called when child process prints text to stdout
   * Calls manager.emitAll with standard out message from the child process
   * @memberof Process
   * @alias instance&period;stdOutEmit
   * @function
   * @public
   * @param {string} data - Output of the running process to be emitted
   * @param {string} group - Group the message is tied to
   * @param {string} name - Name of the command that was run and caused the output
   *
   * @returns {void}
   */
  stdOutEmit = (data, group, name) => {
    !this.filterMessage(data, group, name) &&
      this.manager.emitAll(EventTypes.CMD_OUT, {
        name,
        group,
        message: data,
      })
  }

  /**
   * Callback called when child process prints text to stderr
   * Calls manager.emitAll with standard error message from the child process
   * @memberof Process
   * @alias instance&period;stdErrEmit
   * @function
   * @public
   * @param {string} data - Output of the running process to be emitted
   * @param {string} group - Group the message is tied to
   * @param {string} name - Name of the command that was run and caused the output
   *
   * @returns {void}
   */
  stdErrEmit = (data, group, name) => {
    !this.filterMessage(data, group, name) &&
      this.manager.emitAll(EventTypes.CMD_ERR, {
        name,
        group,
        message: data,
      })
  }

  /**
   * Callback called when child process exits
   * Calls the manager.emitAll with the exitCode
   * @memberof Process
   * @alias instance&period;onExitEmit
   * @function
   * @public
   * @param {string} data - Output of the running process to be emitted
   * @param {string} group - Group the message is tied to
   * @param {string} name - Name of the command that was run and caused the output
   *
   * @returns {void}
   */
  onExitEmit = (code, group, name) => {
    this.manager.isRunning = false
    this.manager.emitAll(EventTypes.CMD_END, {
      name,
      group,
      data: { exitCode: code },
    })
  }

  /**
   * Callback called when child process throws an error
   * Calls the manager.emitAll with the error message
   * @memberof Process
   * @alias instance&period;onErrorEmit
   * @function
   * @public
   * @param {string} err - Error that was thrown by the child process
   * @param {string} group - Group the message is tied to
   * @param {string} name - Name of the command that was run and caused the output
   *
   * @returns {void}
   */
  onErrorEmit = (err, group, name) => {
    const message =
      err.message.indexOf('ENOENT') !== -1
        ? `[ SOCKr CMD ERROR ] - Command '${cmd}' does not exist!\n\nMessage:\n${err.message}`
        : `[ SOCKr CMD ERROR ] - Failed to run command!\n\nMessage:\n${err.message}`

    if (this.filterMessage(err.message, group, name)) return

    this.manager.isRunning = false
    this.manager.emitAll(EventTypes.CMD_FAIL, {
      name,
      group,
      error: true,
      message: message,
    })
  }

  /**
   * Builds the events for the child process, to allow capturing its output
   * @memberof Process
   * @alias instance&period;buildEvents
   * @function
   * @public
   * @param {string} cmd - Command to be run
   * @param {Array} params - Arguments passed to the command
   * @param {string} group - Group the message is tied to
   * @param {string} name - Name of the command that was run and caused the output
   *
   * @returns {Object} child process events object
   */
  buildEvents = (cmd, params, group, name) => {
    return {
      onExit: code => this.onExitEmit(code, group, name),
      onStdOut: data => this.stdOutEmit(data, group, name),
      onStdErr: data => this.stdErrEmit(data, group, name),
      onError: err => this.onErrorEmit(err, group, name),
    }
  }

  /**
   * Executes a command in a child process passed in from the message object
   * @memberof Process
   * @alias instance&period;exec
   * @function
   * @public
   * @param {Object} message - Data object passed from the client
   * @param {string} message.cmd - Command to be run
   * @param {Array} message.params - Arguments passed to the command
   * @param {string} message.group - Group the message is tied to
   * @param {string} message.name - Name of the command that was run and caused the output
   *
   * @returns {Object} child process object
   */
  exec = message => {
    const { name, cmd, params, group } = message

    // Update the connected sockets, that a command is running
    this.manager.isRunning = true
    this.manager.emitAll(EventTypes.CMD_RUNNING, {
      name,
      group,
      data: { cmd, params },
      message: 'Running command',
    })

    return exec(
      ...addConfig(
        cmd,
        params,
        this.config,
        this.buildEvents(cmd, params, group, name)
      )
    )
  }

  /**
   * Binds a socket to RUN_CMD event, that calls the exec method
   * Validates the message passed from the client before executing
   * @memberof Process
   * @alias instance&period;bindSocket
   * @function
   * @public
   * @param {Object} socket - Socket.io socket object
   *
   * @returns {void}
   */
  bindSocket = socket => {
    // Disable checking auth for now until injectable auth is setup
    // this.manager.checkAuth(socket, message, () => {})
    socket.on(EventTypes.RUN_CMD, message => {
      try {
        // Validate the cmd to ensure it is allowed to run
        const message = validateCmd(
          message,
          this.commands,
          this.manager,
          this.config
        )

        // If a cmd is returned, then run the exec method
        return cmd && id && this.exec(message)
      }
      catch (err) {
        console.error(`[ SOCKr CMD ERROR ] - Error running command: ${cmd}`)
        console.error(e.stack)

        this.manager.isRunning = false
        this.manager.emitAll(EventTypes.CMD_RUNNING, {
          name,
          group,
          error: true,
          message: `Error running command:\n${err.message}`,
        })
      }
    })
  }
}
