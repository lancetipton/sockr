/**
 * Cache holder for the sockr sate object
 * Should be update every time the sockr reducer state is changed
 * @type Object
 * @private
 *
 */
let _SOCKR_STATE

/**
 * Cache holder for the sockr dispatch method
 * @function
 * @private
 *
 * @returns {void}
 */
let _SOCKR_DISPATCH = () =>
  console.warn(`Sockr Dispatch has not been initialized!`)

/**
 * Helper to get the sockrDispatch method
 * @function
 * @public
 * @export
 *
 * @returns {function} Sockr dispatch method
 */
export const getState = () => _SOCKR_STATE

/**
 * Helper to get the sockrDispatch method
 * @function
 * @public
 * @export
 *
 * @returns {function} Sockr dispatch method
 */
export const getDispatch = () => _SOCKR_DISPATCH

/**
 * Sets the internally managed sockr state object
 * @function
 * @public
 * @export
 * @param {Object} next - The next state object
 *
 * @returns {void}
 */
export const setNextState = next => {
  _SOCKR_STATE = next
}

/**
 * Sets the internally managed sockr dispatch function
 * @function
 * @public
 * @export
 * @param {function} dispatch - The store dispatch function
 *
 * @returns {void}
 */
export const setDispatch = dispatch => {
  _SOCKR_DISPATCH = dispatch
}

/**
 * Helper matching the redux API to get the getState and getDispatch methods
 * @function
 * @public
 * @export
 * @param {function} dispatch - The store dispatch function
 *
 * @returns {void}
 */
export const getStore = () => {
  return {
    getState,
    getDispatch,
  }
}
