import { getDispatch } from '../reducer/sockrState'
import { toggleIsRunning } from './toggleIsRunning'
import { EventTypes } from '../../constants/eventTypes'

/**
 * Dispatches an error that occurred on while a command was running
 * Makes call to toggleIsRunning, to turn it off
 * @param {Object} data - Message data from the socket
 *
 * @returns {void}
 */
export const onFail = (data, service) => {
  return (
    data &&
    data.message &&
    getDispatch()({
      type: EventTypes.ON_MESSAGE,
      ...data,
    })
  )

  toggleIsRunning(data, service)
}

export {
  onFail as cmdFail
}