import SocketIO from 'socket.io'
import { Manager } from './manager'
import { Process } from './process'
import { EventTypes } from '../constants'
import { checkCall, get } from '@ltipton/jsutils'

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
const setupSocketCmds = (Proc, socket, content) => {
  // Setup the socket, and update connected peers
  Manager.setupSocket(socket, content.commands)

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
 * @param {Object} content - Data that can be exposed by the backend socket
 *
 * @returns {void}
 */
export const sockr = (server, content) => {
  // Setup the socket
  const io = new SocketIO(content.config)

  // attache to the server
  io.attach(server)

  // Ensure we have access to the SocketIO class
  Manager.socketIo = Manager.socketIo || io

    // Create a new process instance
  const Proc = new Process(content.commands, content.filters, content.config)

  // Setup the socket listener, and add socket commands listener
  io.on('connection', socket => setupSocketCmds(Proc, socket, content))

}
