import { EventTypes } from '../../../constants/eventTypes'

export const addPeer = ({ id, peers }, { dispatch }) => {
  return dispatch({
    type: EventTypes.ADD_PEER,
    id,
    peers,
  })
}
