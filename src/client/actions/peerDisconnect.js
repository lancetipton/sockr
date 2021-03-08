import { EventTypes } from '../constants'
import { getDispatch } from '../reducer/sockrState'

/**
 * Dispatches that a peer has disconnected
 * @param {Object} id - Id of the peer that has disconnected
 * @param {Array} peers - Currently connected peers
 *
 * @returns {void}
 */
export const peerDisconnect = ({ id, peers }) => {
  return getDispatch()({
    type: EventTypes.DISCONNECT_PEER,
    id,
    peers,
  })
}
