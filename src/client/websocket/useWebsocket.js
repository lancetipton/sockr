import { SocketContext } from './context'
import { useContext } from 'react'

/**
 * Helper hook to get the websocket content
 * @function
 * @public
 * @export
 *
 * @returns {Object} websocket context object
 */
export const useWebSocket = () => {
  return useContext(SocketContext)
}
