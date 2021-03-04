import { getDispatch } from '../reducer/sockrState'
import { EventTypes } from '../../constants/eventTypes'

/**
 * Dispatches an output message that occurred on while a command was running
 * @param {Object} data - Message data from the socket
 *
 * @returns {void}
 */
export const onMessage = data => {
  data &&
    data.message &&
    getDispatch()({
      type: EventTypes.ON_MESSAGE,
      ...data,
    })
}

export {
  onMessage as cmdOut,
  onMessage as cmdErr
}