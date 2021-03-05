import { getDispatch } from '../reducer/sockrState'
import { toggleIsRunning } from './toggleIsRunning'
import { EventTypes } from '../../constants/eventTypes'

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
