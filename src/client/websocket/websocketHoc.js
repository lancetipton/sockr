import { useWebSocket } from './useWebsocket'
import React from 'react'

/**
 * Websocket HOC component
 * @function
 * @public
 * @export
 * @param {Object} props
 *
 */
export const WebSocketHoc = Component => {
  const websocket = useWebSocket()
  return props => <Component {...props} websocket={websocket} />
}
