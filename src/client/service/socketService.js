import io from 'socket.io-client'
import { checkCall, get, isFunc, noOpObj, camelCase } from '@keg-hub/jsutils'
import { EventTypes } from '../../constants/eventTypes'
import * as InternalActions from '../actions'


/**
 * Maps EventType constants to internal actions methods
 * I.E. EventType.SET_PEERS === actions.setPeers
 * @function
 * @private
 *
 * @returns {Object} - Mapped event types and actions
 */
const mapEventsToInternalActions = () => {
  return Object.keys(EventTypes).reduce((mapped, key) => {
    const name = camelCase(key)
    InternalActions[name] && (mapped[key] = InternalActions[name])
    
    return mapped
  }, {})
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
 * @param {function} action - Method to be called relative to the event type
 * @param {Object} message - Data received from the websocket
 * @param {Object} instance - SocketService class instance
 * @param {string} event - Type of socket event receive
 *
 * @returns {*} Response from the action method
 */
const checkCallEvent = (action, message, instance, event) => {
  return checkCall(action, message, instance, event)
}

/**
 * Calls internal and custom actions with the received message and SocketService class instance
 * @function
 * @private
 *
 * @param {Object} instance - SocketService class instance
 * @param {string} event - Type of socket event receive
 * @param {function} action - Method to be called relative to the event type
 * @param {Object} message - Data received from the websocket
 *
 * @returns {void}
 */
const callAction = (instance, event) => {
  return data => {
    // Parse the data from string to object
    const message = JSON.parse(data)

    // Log the event for debugging
    instance.logEvent(event, message)

    // Call the default internal action if it exists
    const action = instance.internalActions[event]
    action && checkCallEvent(action, message, instance, event)

    // Call the custom action if it exists
    const customAction = get(instance.config, `actions.${event}`)
    customAction && checkCallEvent(customAction, message, instance, event)

  }
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

  internalActions = mapEventsToInternalActions()

  logData = (...data) => this.logDebug && console.log(...data)

  logEvent = (event, data) => this.logDebug && console.log(`Socket Event: ${event}`, data)

  initSocket({ config, dispatch }, token, logDebug=false) {
    // If the sockets already setup, just return
    if (this.socket) return

    this.config = config
    this.dispatch = dispatch
    this.logDebug = logDebug

    const endpoint = buildEndpoint(config.server)
    const socketPath = get(config, 'server.path')
    this.logData(`Connecting to backend socket => ${endpoint}${socketPath}`)

    // Setup the socket, and connect to the server
    this.socket = io(endpoint, {
      path: socketPath,
      transports: [ 'websocket', 'polling', 'flashsocket' ],
    })

    this.addEvents(token)
  }


  addEvents(token) {
    if (!this.socket) return

    // Map the custom config.events with valid actions
    // To listeners on the websocket
    // Skip if an event type matching an internal event
    // Custom event types with the same name as internal event
    // Get called within the callAction of the registered internal event
    Object.entries(get(this.config, 'events', noOpObj))
      .map(([ name, action ]) => {
        const eventType = name.toUpperCase()

        isFunc(action) &&
          !EventTypes[eventType] &&
          this.socket.on(eventType, callAction(this, eventType, action))
      })

    // Map internal events and actions after the custom events
    // We want to make sure the internalActions are always called
    Object.entries(this.internalActions)
      .map(([eventType, action]) => (
        this.socket.on(eventType, callAction(this, eventType, action))
      ))

    // Initial connection to the server through the socket
    // Call the onConnection method which will handel authorization
    this.socket.on(`connect`, this.onConnection.bind(this, token))

  }

  onConnection(token, data) {
    this.logData(`Socket Connected`)

    // TODO: Implement token auth
    // Send the token to the server to be validated
    // this.emit(EventTypes.AUTH_TOKEN, { token: token })
  }

  emit(event, data) {
    if (!this.socket)
      return console.error(`Socket not connected, cannot emit socket event!`)

    if (!event)
      return console.error(
        `Event type is missing, cannot emit socket event without an event type!`,
        event
      )

    this.logData(`Sending Socket Event: ${event}`, data)

    // Send a message to the server
    this.socket.emit(event, data)
  }

  disconnect() {
    if (!this.socket) return this.logData(`Socket already disconnected!`)

    this.logData(`Disconnecting from Socket!`)
    this.socket.disconnect()
    this.socket = undefined
    this.config = undefined
    this.dispatch = undefined
  }
}

export const WSService = new SocketService()
