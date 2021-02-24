import { useReducer, useMemo } from 'react'
import { isFunc, deepMerge } from '@keg-hub/jsutils'
import { EventTypes } from '../../constants/eventTypes'

const initialState = {
  connected: false,
  peers: [],
  id: null,
  runningCmd: null,
  isRunning: false,
}

const reducer = (state, action) => {
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
    return !action.id
      ? state
      : {
          ...state,
          id: action.id,
          peers: action.peers,
          isRunning: action.isRunning,
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

  default:
    return state
  }
}

const joinReducers = (reducer, customReducer) => {
  return (state, action) => {
    const customState = customReducer(state, action)
    return reducer(customState, action)
  }
}

export const useSocketReducer = (customReducer, customInitialState, config) => {
  const socketReducer = isFunc(customReducer)
    ? joinReducers(reducer, customReducer)
    : reducer

  const [ state, dispatch ] = useReducer(
    socketReducer,
    deepMerge(initialState, customInitialState)
  )

  return useMemo(
    () => ({
      state,
      dispatch,
      config,
    }),
    [ state, config ]
  )
}
