import io from 'socket.io-client'
import {
  checkCall,
  get,
  isFunc,
  noOpObj,
  camelCase,
  snakeCase,
  isObj,
} from '@keg-hub/jsutils'
import { EventTypes, tagPrefix, authTokenHeader } from '../constants'
import * as InternalActions from '../actions'

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
  if (config.endpoint) return config.endpoint

  // Use the same http protocol as what the current window is using
  const win = typeof window === 'undefined' ? {} : window
  const protocol = get(win, 'location.protocol', 'https:')

  const namespace = !config.namespace
    ? ``
    : config.namespace.startsWith(`/`)
      ? config.namespace
      : `/${config.namespace}`

  return config.port
    ? `${protocol}//${config.host}:${config.port}${namespace}`.trim()
    : `${config.host}${namespace}`.trim()
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
  const eventName = camelCase((event.split(':')[1] || '').toLowerCase())

  return data => {
    if (!eventName) return instance.logData(`Invalid event name!`, event)

    // Parse the data from string to object
    const message = data && JSON.parse(data)

    // Log the event for debugging
    instance.logEvent(event, message)

    // Look for the init event, and pull out the commands from it
    // Init should only happen when we connect to the socket
    eventName === 'init' && (instance.commands = get(message, 'data.commands'))

    // Call the default internal action if it exists
    const internal = InternalActions[eventName]
    internal && checkCallEvent(internal, message, instance, event)

    // Call the custom action if it exists
    const customEvent = get(instance.config, `events.${eventName}`)
    customEvent && checkCallEvent(customEvent, message, instance, event)

    // Call the all action if it exists
    // Is called for all sockr events that happen on the frontend
    const allEvent = get(instance.config, `events.all`)
    allEvent && checkCallEvent(allEvent, message, instance, event)
  }
}

/**
 * Find the command from the commands ID
 * Searches through all loaded command, looking for a matching id
 * Otherwise returns false
 * @function
 * @private
 *
 * @param {Object} commands - All commands loaded from the back end
 * @param {Object|string} cmdOrId - Command object or id of the command
 *
 * @returns {Object|boolean} - The found command object or false
 */
const getCommand = (commands, cmdOrId) => {
  const cmdId = isObj(cmdOrId) ? cmdOrId.id : cmdOrId

  return Object.entries(commands).reduce((found, [ group, subCmds ]) => {
    return found
      ? found
      : Object.entries(subCmds).reduce((subFound, [ name, definition ]) => {
        return !subFound && isObj(definition) && definition.id === cmdId
          ? definition
          : subFound
      }, false)
  }, false)
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
 * @returns {Object} - Instance of SocketService
 */
export class SocketService {
  io = io

  /**
   * Helper to log data when logDebug is true
   * @memberof SocketService
   * @type function
   * @public
   * @param {*} data - Items to be logged
   *
   * @returns {void}
   */
  logData(...data) {
    this.logDebug && console.log(...data)
  }

  /**
   * Helper to log events when logDebug is true
   * @memberof SocketService
   * @type function
   * @public
   * @param {string} event - Websocket event to be logged
   * @param {*} data - Items to be logged
   *
   * @returns {void}
   */
  logEvent(event, ...data) {
    this.logDebug && console.log(`Socket Event: ${event}`, ...data)
  }

  /**
   * Initializes the web-socket based on the passed in config
   * Starts initial handshake to connect with the backend
   * @memberof SocketService
   * @type function
   * @public
   *
   * @param {Object} config - Options for setting up the websocket
   * @param {string} token - Auth token for validating with the backend
   * @param {boolean} logDebug - Should log Socket events as the happen
   *
   * @returns {void}
   */
  initSocket(config, token, logDebug = false) {
    // If the sockets already setup, just return
    if (this.socket) return

    this.config = config
    this.logDebug = logDebug
    this.token = token

    const endpoint = buildEndpoint(config)

    this.logData(`Connecting to backend socket => ${endpoint}${config.path}`)

    const ioConfig = config.ioConfig || { extraHeaders: {} }

    // Setup the socket, and connect to the server
    this.socket = io(endpoint, {
      path: config.path,
      transports: [ 'websocket', 'polling', 'flashsocket' ],
      ...(token && { auth: { token } }),
      ...ioConfig,
      extraHeaders: {
        ...(ioConfig.extraHeaders || {}),
        ...(token ? { [authTokenHeader]: token } : {}),
      },
    })

    this.addEvents()

    return this
  }

  /**
   * Initializes the web-socket based on the passed in config
   * Starts initial handshake to connect with the backend
   * @memberof SocketService
   * @type Object
   * @public
   *
   * @param {Object} config - Options for setting up the websocket
   * @param {string} token - Auth token for validating with the backend
   * @param {boolean} logDebug - Should log Socket events as the happen
   *
   * @returns {void}
   */
  addEvents() {
    if (!this.socket) return

    // Map the custom config.events with valid actions
    // To listeners on the websocket
    // Skip if an event type matching an internal event
    // Custom event types with the same name as internal event
    // Get called within the callAction of the registered internal event
    Object.entries(get(this.config, 'events', noOpObj)).map(
      ([ name, action ]) => {
        const namCaps = snakeCase(name).toUpperCase()
        if (namCaps === 'ALL') return

        const eventType = `${tagPrefix}:${namCaps}`

        isFunc(action) &&
          !EventTypes[namCaps] &&
          this.socket.on(eventType, callAction(this, eventType))
      }
    )

    // Socket Map Event types to internal actions
    Object.entries(EventTypes).map(([ key, eventType ]) => {
      this.socket.on(eventType, callAction(this, eventType))
    })

    // Initial connection to the server through the socket
    // Call the onConnection method which will handel authorization
    this.socket.on(`connect`, this.onConnection.bind(this))
  }

  /**
   * Callback method called when the websocket connects to the backend
   * @memberof SocketService
   * @type function
   * @public
   * @param {string} token - Auth token for validating with the backend
   * @param {Object} data - Content sent from the backend
   *
   * @returns {void}
   */
  onConnection(token, data) {
    // TODO: Implement token auth
    // Send the token to the server to be validated
    // this.emit(EventTypes.AUTH_TOKEN, { token: token })
    // Then call the `callAction` with the connected event args
    const connectAction = callAction(this, `${tagPrefix}:CONNECT`)
    connectAction(data, token)
  }

  /**
   * Sends an event to the connected backend through websocket ( Like an REST API call )
   * @memberof SocketService
   * @type function
   * @public
   * @param {string} event - Name of the event to emit ( Sent to the backend )
   * @param {Object} data - Content sent to the backend
   *
   * @returns {void}
   */
  emit = (event, data) => {
    if (!this.socket)
      return console.error(`Socket not connected, cannot emit socket event!`)

    if (!event)
      return console.error(
        `Event type is missing, cannot emit socket event without an event type!`,
        event
      )

    this.logData(`Sending Socket Event: ${event}`, data)

    const toSend = isObj(data)
      ? { ...data, token: this.token }
      : { data, token: this.token }

    // Send a message to the server
    this.socket.emit(event, toSend)
  }

  /**
   * Builds the command to be run, and sends it to the backend
   * @memberof SocketService
   * @type function
   * @public
   * @param {Object|string} command - Command data used to build the command for the backend
   *                                  Or the id of the command to be run
   *
   * @returns {void}
   */
  runCommand(command, params) {
    const { id, cmd, name, group } = getCommand(this.commands, command)
    return this.emit(EventTypes.RUN_CMD, {
      id,
      cmd,
      name,
      group,
      params,
      token: this.token,
    })
  }

  /**
   * Disconnects from the backend websocket
   * Cleans up any open object || handles
   * @memberof SocketService
   * @type function
   * @public
   *
   * @returns {void}
   */
  disconnect = () => {
    if (!this.socket) return this.logData(`Socket already disconnected!`)

    this.logData(`Disconnecting from Socket!`)
    this.socket.disconnect()
    this.socket = undefined
    this.config = undefined
    this.dispatch = undefined
  }
}

export const WSService = new SocketService()
