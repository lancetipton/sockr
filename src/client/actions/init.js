import { noOpObj } from '@keg-hub/jsutils'
import { setId } from './setId'
import { setCmds } from './setCmds'

/**
 * Initializes the store when the web-socket is initialised
 * Makes call to store the allowed commands and sets the sockets id
 * @param {Object} data - Message data from the socket
 *
 * @returns {void}
 */
export const init = (data = noOpObj, service = noOpObj) => {
  setCmds(data, service)
  setId(data, service)
}
