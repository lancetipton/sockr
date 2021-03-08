import { getDispatch } from '../reducer/sockrState'
import { toggleIsRunning } from './toggleIsRunning'
import { EventTypes } from '../../constants/eventTypes'

/**
 * Dispatches that a command is running
 * Makes call to toggleIsRunning, to turn it off
 * @param {Object} data - Message data from the socket
 *
 * @returns {void}
 */
export const cmdRunning = data => {
  return (
    data &&
    data.message &&
    getDispatch()({
      type: EventTypes.CMD_RUNNING,
      ...data,
    })
  )

  toggleIsRunning(data)
}