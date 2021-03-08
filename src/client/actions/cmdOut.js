import { EventTypes } from '../constants'
import { getDispatch } from '../reducer/sockrState'

/**
 * Dispatches an output message that occurred on while a command was running
 * @param {Object} data - Message data from the socket
 *
 * @returns {void}
 */
export const cmdOut = data => {
  data &&
    data.message &&
    getDispatch()({
      type: EventTypes.CMD_OUT,
      ...data,
    })
}
