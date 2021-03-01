import { useReducer, useMemo } from 'react'
import { sockrReducer } from './sockrReducer'
import { joinReducers }  from './joinReducers'
import { isFunc, deepMerge } from '@keg-hub/jsutils'
import { setNextState, setDispatch } from './sockrState'

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
  const socketReducer = isFunc(customReducer)
    ? joinReducers(sockrReducer, customReducer)
    : sockrReducer

  // Build the reducers with the joined default state and custom state
  const [ state, dispatch ] = useReducer(
    socketReducer,
    deepMerge(initialState, customInitialState)
  )

  // Memoize setting the next sate to the state object
  // This way we don't update any listeners when there's not change
  useMemo(() => setNextState(state), [state])

  // Memoize setting the dispatch method
  // Technically the dispatch method should not change
  // This ensures we only update if it does
  useMemo(() => setDispatch(dispatch), [dispatch])

  return state
}

