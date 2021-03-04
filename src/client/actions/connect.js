import { getDispatch } from '../reducer/sockrState'
import { EventTypes } from '../../constants/eventTypes'

export const connect = () => {
  return getDispatch()({
    type: EventTypes.CONNECT,
    connected: true,
  })
}
