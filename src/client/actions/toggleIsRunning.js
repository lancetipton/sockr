import { EventTypes } from '../constants'
import { getDispatch } from '../reducer/sockrState'

/**
 * Toggles if the backend is running a command
 * @param {Boolean} isRunning - Is the backend running a command
 * @param {string} name - Name of the command being run
 *
 * @returns {void}
 */
export const toggleIsRunning = ({ isRunning, name }) => {
  getDispatch()({
    type: EventTypes.CMD_RUNNING,
    isRunning,
    name,
  })
}
