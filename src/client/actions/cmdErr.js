import { getDispatch } from '../reducer/sockrState'
import { EventTypes } from '../../constants/eventTypes'

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