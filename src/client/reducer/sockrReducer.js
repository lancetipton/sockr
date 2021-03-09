import { EventTypes } from '../constants'
import { noOpObj } from '@keg-hub/jsutils'

/**
 * Initial state of the sockr reducer
 * @type Object
 */
const initialState = {
  connected: false,
  peers: [],
  id: null,
  runningCmd: null,
  isRunning: false,
  server: noOpObj,
  events: noOpObj,
}

/**
 * Default reducer for sockr
 * @type function
 * @public
 * @export
 * @param {Object} [state=initialState] - Initial state of the reducer
 * @param {Object} action - Properties define how to update the current reducer state
 *
 * @returns {Object} Reducers state with the actions updates applied
 */
export const sockrReducer = (state = initialState, action) => {
  if (!state || !action || !action.type) return state

  switch (action.type) {
  case EventTypes.CONNECT: {
    return action.connected === state.connected
      ? state
      : {
          ...state,
          connected: true,
        }
  }

  case EventTypes.SET_ID: {
    const { type, ...updates } = action
    return !action.id
      ? state
      : {
          ...state,
          ...updates,
        }
  }

  case EventTypes.CMD_RUNNING: {
    return action.isRunning === state.isRunning
      ? state
      : {
          ...state,
          runningCmd: (action.isRunning && action.name) || null,
          isRunning: action.isRunning,
        }
  }

  case EventTypes.ADD_PEER: {
    return !action.peers
      ? state
      : {
          ...state,
          peers: action.peers,
        }
  }

  case EventTypes.DISCONNECT_PEER: {
    return !action.peers
      ? state
      : {
          ...state,
          peers: action.peers,
        }
  }

  default: {
    return state
  }
  }
}
