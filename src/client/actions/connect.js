import { getDispatch } from '../reducer/sockrState'
import { EventTypes } from '../../constants/eventTypes'

/**
 * Dispatches event that the web-socket has connected
 *
 * @returns {void}
 */
export const connect = () => {
  return getDispatch()({
    type: EventTypes.CONNECT,
    connected: true,
  })
}
