const { EventTypes, tagPrefix } = require('../../constants')
const {
  get,
  isFunc,
  isObj,
  isStr,
  uuid,
  noOp,
  noOpObj,
  snakeCase,
  checkCall,
  deepMerge,
} = require('@keg-hub/jsutils')

const EventTypeValues = Object.values(EventTypes)

/**
 * Gets the current time, used for a timestamp
 * @function
 * @private
 *
 * @returns {string} - Current time
 */
const getTimeStamp = () => new Date().getTime()

/**
 * Helper to log errors when they are thrown
 * @function
 * @private
 * @param {Object} err - Error object that was thrown
 * @param {string} method - Method where the error was thrown
 *
 * @returns {void}
 */
const logError = (err = noOpObj, method) => {
  console.log(`[ Socket Error ] --- SocketManager.${method}`)
  err.stack && console.error(err.stack)
}

/**
 * Class for managing socket.io sockets
 * Keeps track of connected sockets and currently running command process
 * Handles broadcasting / emitting events
 * @todo - Add authentication
 * @class
 * @public
 * @export
 * @param {Object} opts - socket.io web-socket object
 *
 * @returns {Object} - SocketManager class instance
 */
class SocketManager {
  constructor(opts = {}) {
    this.cache = {}
    this.peers = {}
    this.socketIo
    this.isRunning = false
  }

  /**
   * Add tag formatting for custom events
   * @param {string} tag - Event tag name used to emit the event
   *
   * @returns {string} - Formatted tag with tagPrefix
   */
  formatTag = tag => {
    if (EventTypeValues.includes(tag)) return tag

    const trimmed = tag.trim()
    const [ ___, ...split ] = trimmed.startsWith(`${tagPrefix}:`)
      ? trimmed.split(':')
      : [ null, trimmed ]

    return `${tagPrefix}:${snakeCase(
      split.join(':').replace(/:\s/g, '_')
    ).toUpperCase()}`
  }

  /**
   * Helper to build the message model object
   * @function
   * @private
   * @param {Object} message - Content of the message overriding the default
   *
   * @returns {Object} - Message model object
   */
  buildMessage = (message = noOpObj, socket) => {
    // Ensure the message is an object
    const messageObj = isObj(message) ? message : { message }
    // If a socket is passed, add the socket Id and socket group Id
    if (socket) {
      messageObj.socketId = socket.id
      messageObj.groupId = get(this.cache, [ socket.id, `groupId` ])
    }

    return deepMerge(
      {
        id: uuid(),
        message: '',
        error: false,
        data: noOpObj,
        group: 'all',
        name: 'general',
        isRunning: this.isRunning,
        timestamp: getTimeStamp(),
      },
      messageObj
    )
  }

  /**
   * Registers auth for connecting to the socket manager
   * @memberof SocketManager
   * @alias instance&period;setAuth
   * @function
   * @public
   * @todo - Implement auth
   * @param {Object} auth - Socket auth config settings
   *
   * @returns {void}
   */
  setAuth = (config = noOpObj) => {
    const { onAuthenticate = noOp, onAuthFail = noOp } = config
    this.auth = (socket, event, message, callback) => {
      const eventArgs = {
        data: message,
        socket,
        config,
        event,
        io: this.socketIo,
      }
      new Promise(async (res, rej) => {
        try {
          await onAuthenticate(eventArgs)
          res(true)
        }
        catch (err) {
          rej(err)
        }
      })
        .then(() => checkCall(callback, eventArgs))
        .catch(err => {
          onAuthFail({ ...eventArgs, err })
          this.onDisconnect(socket)
        })
    }
  }

  /**
   * Checks for authorization of a socket request
   * @memberof SocketManager
   * @alias instance&period;checkAuth
   * @todo - Implement auth
   * @todo - Checks the sockets auth before allow a socket request
   * @function
   * @public
   * @param {Object|string} socket - Socket.io socket object or socket id
   * @param {string} event - Name of the event that was received
   * @param {string} message - Message returned when socket is not authorized
   * @param {function} callback - Called when the socket has been authorized
   *
   * @returns {*} - Response from the passed in callback method
   */
  checkAuth = (socket, event, message, callback) => {
    return !this.auth
      ? checkCall(callback, this, socket, message)
      : this.auth(socket, event, message, callback)
  }

  /**
   * Adds a socket to the peers list
   * Sets up the on-disconnect callback, called when a socket disconnects
   * @memberof SocketManager
   * @alias instance&period;add
   * @function
   * @public
   * @param {Object} socket - Socket.io socket object
   * @param {Object} io - Socket.io socket object
   *
   * @returns {string} Id the the added socket
   */
  add = socket => {
    this.peers[socket.id] = socket
    this.cache[socket.id] = {}

    return socket.id
  }

  /**
   * Gets the socket id based on the passed in id or socket object
   * @memberof SocketManager
   * @alias instance&period;getId
   * @function
   * @public
   * @param {Object|string} sockOrId - Socket.io socket object or socket id
   *
   * @returns {string} Id the the added socket
   */
  getId = sockOrId => (isStr(sockOrId) && sockOrId) || sockOrId.id

  /**
   * Gets the socket object based on the passed in id
   * @memberof SocketManager
   * @alias instance&period;getSocket
   * @function
   * @public
   * @param {Object|string} sockOrId - Socket.io socket object or socket id
   *
   * @returns {string} Socket.io socket object
   */
  getSocket = id => this.peers[id]

  /**
   * Converts the passed in data object into a string
   * @memberof SocketManager
   * @alias instance&period;toJsonStr
   * @function
   * @public
   * @param {Object} data - Object to be converted into a json string
   *
   * @returns {string} Data object as a json string
   */
  toJsonStr = data => {
    try {
      return JSON.stringify((!isObj(data) && { data }) || data)
    }
    catch (err) {
      logError(err, 'toJsonStr')
      return JSON.stringify({ error: 'Error in SocketManager.toJsonStr' })
    }
  }

  /**
   * Calls the passed in sockets emit method.
   * Passes tag and string formatted data object as arguments
   * @memberof SocketManager
   * @alias instance&period;emit
   * @function
   * @public
   * @param {Object|string} socket - Socket.io socket object or socket id
   * @param {string} tag - Type of event to emit to
   * @param {Object} data - Object to emit to the socket
   *
   * @returns {void}
   */
  emit = (socket, tag, data) => {
    try {
      if (isStr(socket)) socket = this.getSocket(socket)

      if (!socket || !isFunc(socket.emit))
        return console.error(
          `A Socket with an emit method is required to emit events!`
        )

      const toSend = isObj(data) ? data : { data }
      toSend.socketId = socket.id
      toSend.groupId = get(this.cache, [ socket.id, `groupId` ])

      socket.emit(
        this.formatTag(tag),
        this.toJsonStr(this.buildMessage(toSend, socket))
      )
    }
    catch (err) {
      logError(err, 'emit')
    }
  }

  /**
   * Broadcasts a message to all connected sockets other then the passed in socket
   * Passes tag and string formatted data object as arguments
   * @memberof SocketManager
   * @alias instance&period;broadCastAll
   * @function
   * @public
   * @param {Object|string} socket - Socket.io socket object or socket id
   * @param {string} tag - Type of event to broadcast to
   * @param {Object} data - Object to emit to the socket
   *
   * @returns {void}
   */
  broadCastAll = (socket, tag, data) => {
    try {
      if (isStr(socket)) socket = this.getSocket(socket)

      socket &&
        socket.broadcast &&
        isFunc(socket.broadcast.emit) &&
        socket.broadcast.emit(
          this.formatTag(tag),
          this.toJsonStr(this.buildMessage(data, socket))
        )
    }
    catch (err) {
      logError(err, 'broadCastAll')
    }
  }

  /**
   * Emits a message to all socketsIo sockets
   * Passes tag and string formatted data object as arguments
   * @memberof SocketManager
   * @alias instance&period;broadCastAll
   * @function
   * @public
   * @param {string} tag - Type of event to emit to
   * @param {Object} data - Object to emit to the socket
   *
   * @returns {void}
   */
  emitAll = (tag, data) => {
    try {
      if (!this.socketIo)
        return console.error(`Socket.IO is not set on SocketManager!`)
      if (!tag)
        return console.error(
          `SocketManager.emitAll requires an event tag as param 2!`
        )

      const groupId = get(this.cache, [ data.socketId, `groupId` ])

      // TODO: Update to emit only to group room when group Id exists
      this.socketIo.emit(
        this.formatTag(tag),
        this.toJsonStr(this.buildMessage({ ...data, groupId }))
      )
    }
    catch (err) {
      logError(err, 'emitAll')
    }
  }

  /**
   * Sets up a connected socket, and emits the init event
   * Sends the sockets id and initial content
   * Broadcasts to all connected sockets that a new socket has connected
   * @memberof SocketManager
   * @alias instance&period;setupSocket
   * @function
   * @public
   * @param {Object} socket - Socket.io socket object
   * @param {Object} content - Initial content to send when the socket has connected
   *
   * @returns {void}
   */
  setupSocket = (socket, commands) => {
    try {
      const id = this.add(socket)
      if (!id)
        return console.error(
          'Could not add socket. No id returned.',
          socket,
          id
        )

      this.emit(socket, EventTypes.INIT, {
        id,
        data: { commands, peers: Object.keys(this.peers) },
        message: 'Server socket initialized!',
      })

      this.broadCastAll(socket, EventTypes.ADD_PEER, {
        id: socket.id,
        data: { peers: Object.keys(this.peers) },
      })
    }
    catch (err) {
      logError(err, 'setupSocket')
    }
  }

  /**
   * Force disconnects a socket when it's not authorized
   * @memberof SocketManager
   * @alias instance&period;disconnect
   * @function
   * @public
   * @param {Object|string} socket - Socket.io socket object or socket id
   * @param {Object} message - Message to send when the socket is disconnected
   * @param {string} [tag=`NOT_AUTHORIZED`] - Type of event to emit to
   *
   * @returns {void}
   */
  disconnect = (socket, message, tag = EventTypes.NOT_AUTHORIZED) => {
    // Ensure we have the socket object and not the id
    if (isStr(socket)) socket = this.getSocket(socket)

    // If no socket can be found, then just return
    if (!socket) return

    // Update the client with the NOT_AUTHORIZED event
    this.emit(socket, tag, {
      message: message || 'Missing authorization. Please login!',
    })

    // Clear any cache data if needed
    delete this.cache[socket.id]

    // Wait a little bit tl allow the NOT_AUTHORIZED event to be sent,
    setTimeout(() => socket.disconnect(), 100)
  }

  /**
   * Handles when a socket disconnects from the server
   * Broadcasts to all connected sockets that a socket has disconnected
   * Ensures the socket is removed from the peers list
   * @memberof SocketManager
   * @alias instance&period;onDisconnect
   * @function
   * @public
   * @param {Object|string} socket - Socket.io socket object or socket id
   *
   * @returns {void}
   */
  onDisconnect = socket => {
    // Ensure we have the socket object and not the id
    if (isStr(socket)) socket = this.getSocket(socket)

    try {
      // Clear any cache data if needed
      delete this.cache[socket.id]

      if (!this.peers[socket.id]) return

      delete this.peers[socket.id]

      this.emitAll(EventTypes.PEER_DISCONNECT, {
        id: socket.id,
        data: { peers: Object.keys(this.peers) },
      })
    }
    catch (err) {
      logError(err, 'onDisconnect')
      if (isObj(this.peers)) delete this.peers[socket.id]
    }
  }
}

/**
 * Creates a singleton, that can be imported with consistent data
 */
const Manager = new SocketManager()

module.exports = {
  Manager,
  SocketManager,
}
