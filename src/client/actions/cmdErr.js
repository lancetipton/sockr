import { EventTypes } from '../constants'
import { getDispatch } from '../reducer/sockrState'

/**
 * Dispatches an error message that occurred on while a command was running
 * @param {Object} data - Message data from the socket
 *
 * @returns {void}
 */
export const cmdErr = data => {
  data &&
    data.message &&
    getDispatch()({
      type: EventTypes.CMD_ERR,
      ...data,
    })
}
