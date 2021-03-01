import { useSockr } from '../hooks/useSockr'
import React from 'react'

/**
 * Websocket HOC component
 * @function
 * @public
 * @export
 * @param {Object} props
 *
 */
export const SockrHoc = Component => {
  const websocket = useSockr()
  return props => <Component {...props} websocket={websocket} />
}
