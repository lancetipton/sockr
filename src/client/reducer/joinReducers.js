/**
 * Cache holder for the joined reducers function
 * @type function
 * @private
 */
let _JOINED_REDUCERS

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
  // If the joined reducers are already set, just return them
  if (_JOINED_REDUCERS) return _JOINED_REDUCERS

  // Set the join reducer function, then return it
  _JOINED_REDUCERS = (state, action) => {
    const updatedState = sockrReducer(state, action)
    return customReducer(updatedState, action)
  }

  return _JOINED_REDUCERS
}
