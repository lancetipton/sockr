const { spawn } = require('child_process')
const { noOpObj, noPropArr, deepMerge } = require('@keg-hub/jsutils')

/**
 * Default options when executing a command
 * @object
 */
const defOpts = {
  gid: process.getgid(),
  uid: process.getuid(),
  env: process.env,
  stdio: 'pipe',
}

/**
 * Creates a child process and executes a command
 * @function
 * @public
 * @export
 * @param {string} cmd - Command to be executed
 * @param {Array} args - Arguments to pass to the command,
 * @param {Object} execOpts - Extra options to pass to the command
 * @param {string} cwd - Working directory for the command
 * @param {Object} env - Extra envs when the command is run
 *
 * @returns {void}
 */
const exec = async (...props) => {
  const [
    // eslint-disable-next-line no-unused-vars
    config = noOpObj,
    cmd,
    args = noPropArr,
    opts = noOpObj,
    events = noOpObj,
    cwd,
    env = noOpObj,
  ] = props

  const childProc = spawn(
    cmd,
    args,
    deepMerge(
      defOpts,
      {
        cwd: cwd || process.cwd(),
        detached: false,
        shell: '/bin/bash',
        env,
      },
      opts
    )
  )

  childProc.stdout && childProc.stdout.setEncoding('utf-8')
  childProc.stderr && childProc.stderr.setEncoding('utf-8')

  childProc.on('error', events.onError)
  childProc.on('exit', events.onExit)
  childProc.stdout.on('data', events.onStdOut)
  childProc.stderr.on('data', events.onStdErr)
}

module.exports = {
  exec,
}
