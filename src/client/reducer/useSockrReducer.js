import { useReducer } from 'react'
import { sockrReducer } from './sockrReducer'
import { joinReducers } from './joinReducers'
import { deepMerge } from '@keg-hub/jsutils'
import { getDispatch, getState, setNextState, setDispatch } from './sockrState'

/**
 * Call the sockr reducer to get the initial state
 * @object
 */
const initialState = sockrReducer()

// Set the initial sate to the sockrState object
setNextState(initialState)

/**
 * Hook to setup the sockr reducer and initialize the sockr state
 * Also joins the custom reducer and state with the defaults
 * @function
 * @public
 * @export
 * @param {function} customReducer - Custom reducer passed in by the sockr consumer
 * @param {Object} customInitialState - Custom initial state to override the defaults
 *
 * @returns {function} Single reducer function
 */
export const useSockrReducer = (customReducer, customInitialState) => {
  // Join the reducers if a custom reducer is passed in
  // And build the reducers with the joined default state and custom state
  const [ state, dispatch ] = useReducer(
    joinReducers(sockrReducer, customReducer),
    deepMerge(initialState, customInitialState)
  )

  // Update the internal state so we can keep track of it
  getState() !== state && setNextState(state)

  // Technically the dispatch method should never change, so no need to memoize
  getDispatch() !== dispatch && setDispatch(dispatch)

  return state
}
