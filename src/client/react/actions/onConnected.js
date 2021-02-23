import { EventTypes } from '../../../constants/eventTypes'

export const onConnected = (__, { dispatch }) => {
  return dispatch({
    type: EventTypes.ON_CONNECTED,
    connected: true,
  })
}
