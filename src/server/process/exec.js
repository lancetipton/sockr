const { spawnCmd } = require('@keg-hub/spawn-cmd')
const { noOpObj, noPropArr } = require('@keg-hub/jsutils')

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
 * @param {Object} opts - Extra options to pass to the command
 * @param {string} cwd - Working directory for the command
 * @param {Object} env - Extra envs when the command is run
 *
 * @returns {void}
 */
const exec = (cmd, args = noPropArr, opts = noOpObj, cwd, env = noOpObj) => {
  return spawnCmd(cmd, {
    args,
    cwd: cwd || opts.cwd || process.cwd(),
    options: {
      ...defOpts,
      ...opts,
      env: {
        ...defOpts.env,
        ...opts.env,
        ...env,
      },
    },
  })
}

module.exports = {
  exec,
}
