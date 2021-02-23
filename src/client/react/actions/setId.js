import { EventTypes } from '../../../constants/eventTypes'

export const setId = ({ id, peers, isRunning }, { dispatch }) => {
  dispatch({
    type: EventTypes.SET_ID,
    id,
    peers,
    isRunning,
  })
}
