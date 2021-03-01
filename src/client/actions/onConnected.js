import { getDispatch } from '../reducer/sockrState'
import { EventTypes } from '../../constants/eventTypes'

export const onConnected = () => {
  return getDispatch()({
    type: EventTypes.ON_CONNECTED,
    connected: true,
  })
}
