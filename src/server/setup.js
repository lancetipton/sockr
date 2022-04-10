const SocketIO = require('socket.io')
const { Manager } = require('./manager')
const { Process } = require('./process')
const { loadConfig } = require('./loadConfig')
const { checkCall, get, noOpObj, isFunc } = require('@keg-hub/jsutils')

/**
 * Sets up the commands that can be run by the backend socket
 * @function
 * @public
 * @export
 * @param {Object} socket - socket.io web-socket object
 * @param {Object} commands - Data that can be exposed by the backend socket
 *
 * @returns {void}
 */
const setupSocketCmds = (Proc, socket, config) => {
  // Setup the socket, and update connected peers
  Manager.setupSocket(socket, config.commands)

  // Setup the socket to listen for commands to run
  Proc.bindSocket(socket)
}

/**
 * Sets up custom websocket events base on the config.events object
 * @function
 * @public
 * @export
 * @param {Object} socket - socket.io web-socket object
 * @param {Object} config - Config for setting up socket including custom events
 *
 * @returns {void}
 */
const setupSocketEvents = (socket, config) => {
  const events = get(config, 'events', noOpObj)
  // Ensure the onDisconnect event get attached to the socket if no disconnect event
  !events.disconnect &&
    socket.on('disconnect', _ => Manager.onDisconnect(socket))

  Object.entries(events).map(([ name, method ]) => {
    name !== 'connection' && name !== 'disconnect'
      ? socket.on(name, data =>
        checkCall(method, {
          data,
          socket,
          config,
          Manager,
          io: SocketIO,
        })
      )
      : name === 'disconnect' &&
        socket.on(name, async data => {
          // If there's an disconnect event
          // Call it first and catch any errors it throws
          // then call the Manager.onDisconnect to ensure it's called
          // Finally re-throw the error if one waw caught
          let disconnectError
          try {
            isFunc(method) &&
              (await method({
                data,
                socket,
                config,
                Manager,
                io: SocketIO,
              }))
          }
          catch (err) {
            disconnectError = err
          }
          Manager.onDisconnect(socket)

          if (disconnectError) throw disconnectError
        })
  })
}

/**
 * Initialization method for sockr setup
 * Setups up socket.io on the backend
 * @function
 * @public
 * @export
 * @param {Object} server - Backend http server ( express, restify, etc... )
 * @param {Object} config - Data that can be exposed by the backend socket
 *
 * @returns {void}
 */
const sockr = async (server, config, cmdGroup) => {
  const sockrConfig = await loadConfig(config, cmdGroup)

  // Setup the socket
  const io = SocketIO({ path: sockrConfig.socket.path })

  // attache to the server
  io.attach(server)

  // Ensure we have access to the SocketIO class
  Manager.socketIo = Manager.socketIo || io

  // Create a new process instance
  const Proc = new Process(
    sockrConfig.commands,
    sockrConfig.filters,
    sockrConfig.process
  )

  // Setup the socket listener, and add socket commands listener
  io.on('connection', socket => {
    setupSocketCmds(Proc, socket, sockrConfig)
    setupSocketEvents(socket, sockrConfig)
    // Call the connection event if it exists
    checkCall(get(config, 'events.connection'), {
      socket,
      config,
      Manager,
      io: SocketIO,
    })
  })
}

module.exports = {
  sockr,
  Manager,
}
