import { isObj } from '@keg-hub/jsutils'
import { setNextState } from './sockrState'

/**
 * Joins the custom reducer method with the default sockr reducer
 * @function
 * @public
 * @export
 * @param {function} sockrReducer - Default sockr reducer
 * @param {function} customReducer - Custom reducer passed in by the sockr consumer
 *
 * @returns {function} Single reducer function
 */
export const joinReducers = (sockrReducer, customReducer) => {
  return (state, action) => {
    const customState = customReducer(state, action)
    const validObj = isObj(customState)
    !validObj &&
      console.warn(`The customReducer function did not return a state Object!`, customState)

    const nextState = sockrReducer(isObj(customState) ? customState : state, action)
    setNextState(nextState)

    return nextState
  }
}