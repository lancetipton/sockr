import { isObj, noOpObj } from '@keg-hub/jsutils'
import { EventTypes } from '../../constants/eventTypes'

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
export const sockrReducer = (state=initialState, action) => {

  if(!state || !action || !action.type) return state

  switch (action.type) {

    case EventTypes.ON_CONNECTED: {
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
            ...updates
          }
    }

    case EventTypes.IS_RUNNING: {
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

    case EventTypes.UPDATE_STORE: {
      const actionKeys = Object.keys(action)
      const keyUpdate = actionKeys.includes('key') && actionKeys.includes('value')
    
      return !keyUpdate && !isObj(action.config)
        ? state
        : keyUpdate
          ? { ...state, [action.key]: action.value }
          : { ...state, ...(action.config || noOpObj) }
    }

    default: {
      return state
    }

  }
}
