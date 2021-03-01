import { getDispatch } from '../reducer/sockrState'
import { EventTypes } from '../../constants/eventTypes'

export const addPeer = ({ id, peers }) => {
  return getDispatch()({
    type: EventTypes.ADD_PEER,
    id,
    peers,
  })
}
