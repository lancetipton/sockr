import { getDispatch } from '../reducer/sockrState'
import { EventTypes } from '../../constants/eventTypes'

/**
 * Dispatches passed in commands to the reducers
 * @param {Object} data - Message data from the socket
 *
 * @returns {void}
 */
export const setCmds = ({ data: { commands } }) => {
  return getDispatch()({
    commands,
    type: EventTypes.SET_CMDS,
  })
}
