import { getDispatch } from '../reducer/sockrState'
import { EventTypes } from '../../constants/eventTypes'

export const peerDisconnect = ({ id, peers }) => {
  return getDispatch()({
    type: EventTypes.DISCONNECT_PEER,
    id,
    peers,
  })
}
