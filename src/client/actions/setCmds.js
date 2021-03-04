import { getDispatch } from '../reducer/sockrState'
import { EventTypes } from '../../constants/eventTypes'

/**
 * Dispatches passed in commands to the reducers
 * @param {Object} data - Message data from the socket
 *
 * @returns {void}
 */
export const setCmds = (data) => {
  console.log(`---------- data ----------`)
  console.log(data)

  // return getDispatch()({
  //   type: EventTypes.ADD_PEER,
  // })

  // TODO: the the allow tasks the can be run
}