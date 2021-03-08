import { EventTypes } from '../constants'
import { getDispatch } from '../reducer/sockrState'

/**
 * Dispatches a connected peers id
 * @param {Object} id - Id of the peer that has connected
 * @param {Array} peers - Currently connected peers
 *
 * @returns {void}
 */
export const addPeer = ({ id, peers }) => {
  return getDispatch()({
    type: EventTypes.ADD_PEER,
    id,
    peers,
  })
}
