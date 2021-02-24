import { EventTypes } from '../../constants/eventTypes'

export const peerDisconnect = ({ id, peers }, { dispatch }) => {
  return dispatch({
    type: EventTypes.DISCONNECT_PEER,
    id,
    peers,
  })
}
