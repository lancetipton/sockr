import { EventTypes } from '../constants'
import { getDispatch } from '../reducer/sockrState'

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
