import { EventTypes } from '../constants'
import { getDispatch } from '../reducer/sockrState'
import { toggleIsRunning } from './toggleIsRunning'

/**
 * Dispatches an error that occurred on while a command was running
 * Makes call to toggleIsRunning, to turn it off
 * @param {Object} data - Message data from the socket
 *
 * @returns {void}
 */
export const cmdFail = (data, service) => {
  return (
    data &&
    data.message &&
    getDispatch()({
      type: EventTypes.CMD_FAIL,
      ...data,
    })
  )

  toggleIsRunning(data, service)
}
