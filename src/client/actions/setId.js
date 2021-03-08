import { EventTypes } from '../constants'
import { getDispatch } from '../reducer/sockrState'

/**
 * Dispatches that a peer has disconnected
 * @param {Object} id - Id of the connected socket
 * @param {Boolean} isRunning - Is the backend running a command
 * @param {Boolean} data - Extra metadata sent from the backend
 *
 * @returns {void}
 */
export const setId = ({ id, data, isRunning }) => {
  getDispatch()({
    type: EventTypes.SET_ID,
    id,
    isRunning,
    ...data,
  })
}
