import SocketIO from 'socket.io'
import { Manager } from './manager'
import { Process } from './process'

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
export const sockr = (server, config) => {
  // Setup the socket
  const io = new SocketIO(config.socket)

  // attache to the server
  io.attach(server)

  // Ensure we have access to the SocketIO class
  Manager.socketIo = Manager.socketIo || io

  // Create a new process instance
  const Proc = new Process(config.commands, config.filters, config.config)

  // Setup the socket listener, and add socket commands listener
  io.on('connection', socket => setupSocketCmds(Proc, socket, config))
}
