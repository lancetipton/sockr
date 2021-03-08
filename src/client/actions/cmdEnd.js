import { EventTypes } from '../constants'
import { getDispatch } from '../reducer/sockrState'
import { toggleIsRunning } from './toggleIsRunning'

/**
 * Dispatches when a command has finished running
 * Makes call to toggleIsRunning, to turn it off
 * @param {Object} data - Message data from the socket
 *
 * @returns {void}
 */
export const cmdEnd = data => {
  return (
    data &&
    data.message &&
    getDispatch()({
      type: EventTypes.CMD_END,
      ...data,
    })
  )

  toggleIsRunning(data)
}
