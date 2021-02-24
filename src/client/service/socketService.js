import io from 'socket.io-client'
import { checkCall, get, isFunc } from '@keg-hub/jsutils'
import { EventTypes } from '../../constants/eventTypes'

/**
 * Converts the passed in message into string into an object
 * @function
 * @private
 *
 *
 * @returns {string} - Built websocket endpoint
 */
const formatEvt = cb => {
  return message => isFunc(cb) && cb(message && JSON.parse(message))
}

/**
 * Builds the websocket endpoint to connect to the backend websocket
 * @function
 * @private
 *
 * @param {Object} config - Websocket client config object matching the config spec
 *
 * @returns {string} - Built websocket endpoint
 */
const buildEndpoint = config => {
  // TODO: update to get the current http protocol from window.location
  return config.port ? `http://${config.host}:${config.port}` : config.host
}

/**
 * Calls the passed in actions with the received message and SocketService class instance
 * @function
 * @private
 *
 * @param {Object} socketInstance - SocketService class instance
 * @param {function} action - Method to be called relative to the event type
 * @param {string} event - Type of socket event receive
 * @param {Object} message - Data received from the websocket
 *
 * @returns {*} Response from the action method
 */
const checkCallEvent = (socketInstance, action, event, message) => {
  return checkCall(get(action, event), message, socketInstance)
}

/**
 * Calls internal and custom actions with the received message and SocketService class instance
 * @function
 * @private
 *
 * @param {Object} socketInstance - SocketService class instance
 * @param {function} action - Method to be called relative to the event type
 * @param {string} event - Type of socket event receive
 * @param {Object} message - Data received from the websocket
 *
 * @returns {void}
 */
const callAction = (socketInstance, action, event, message) => {
  // Get the custom action if it exists
  const customAction = get(socketInstance.config, `events.${event}`)
  // Try to call it
  checkCallEvent(socketInstance, customAction, event, message)
  // Call the default internal action
  checkCallEvent(socketInstance, action, event, message)
}

/**
 * Service class for managing client websocket events
 * @function
 * @private
 *
 * @param {Object} config - Websocket client config object matching the config spec
 * @param {function} dispatch - Method to be called to update the websocket state
 * @param {string} token - Auth token for connecting to the websocket
 *
 * @returns {void}
 */
export class SocketService {
  initSocket({ config, dispatch }, token) {
    // If the sockets already setup, just return
    if (this.socket) return

    this.config = config
    this.dispatch = dispatch

    // Setup the socket, and connect to the server
    this.socket = io(buildEndpoint(config.server), {
      path: get(config, 'server.path'),
      transports: [ 'websocket', 'polling', 'flashsocket' ],
    })
    this.addEvents(token)
  }

  addEvents(token) {
    if (!this.socket) return

    // Initial connection to the server through the socket
    // Call the onConnection method which will handel authorization
    this.socket.on(`connect`, formatEvt(this.onConnection.bind(this, token)))

    // EventTypes.SET_ID is called directly after the Auth token
    // You can assume at this point, the user is authorized
    this.socket.on(
      EventTypes.INIT,
      formatEvt(message => {
        console.log(`---------- message ----------`)
        console.log(message)
        // onConnected(message)
        // setTasks(message)
        // setId(message)
      })
    )

    // // Add / Remove peer users, may be used later
    // this.socket.on(EventTypes.ADD_PEER, formatEvt(addPeer))
    // this.socket.on(EventTypes.PEER_DISCONNECT, formatEvt(peerDisconnect))

    // // The event captures the command output from the server
    // this.socket.on(EventTypes.CMD_OUT, formatEvt(onMessage))

    // // The event captures the command error output from the server
    // this.socket.on(EventTypes.CMD_ERR, formatEvt(onMessage))
    this.socket.on(EventTypes.CMD_ERR, callAction())

    // // The event captures the command fail output from the server
    // this.socket.on(EventTypes.CMD_FAIL, formatEvt(onFail))

    // // Ensure the isRunning toggle is switched off after a command finishes running
    // // Loops through the toggle event types and adds a listener for each one
    // runningToggleEvents.map(event => this.socket.on(
    //   event,
    //   formatEvt(toggleIsRunning)
    // ))
  }

  onConnection(token, message) {
    // Send the token to the server to be validated
    // this.emit(EventTypes.AUTH_TOKEN, { token: token })
  }

  emit(type, data) {
    if (!this.socket)
      return console.error(`Socket not connected, cannot emit socket event!`)

    if (!type)
      return console.error(
        `Event type is missing, cannot emit socket event!`,
        type
      )

    // Send a message to the server
    this.socket.emit(type, data)
  }

  disconnect() {
    if (!this.socket) return console.log(`Socket already disconnected!`)

    console.log(`Disconnecting from Socket!`)
    this.socket.disconnect()
    this.socket = undefined
    this.config = undefined
  }
}

export const WSService = new SocketService()
