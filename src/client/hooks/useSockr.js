import { SocketContext } from '../context/context'
import { useContext } from 'react'

/**
 * Helper hook to get the websocket content
 * @function
 * @public
 * @export
 *
 * @returns {Object} websocket context object
 */
export const useSockr = () => {
  return useContext(SocketContext)
}
