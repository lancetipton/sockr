import { WSService } from '../service'
import { SocketContext } from './context'
import { noOpObj } from '@keg-hub/jsutils'
import React, { useEffect } from 'react'
import { useSockrReducer } from '../reducer/useSockrReducer'

const isDev = process.env.NODE_ENV === 'development'

/**
 * Component to memoize the children of the context provider
 * @function
 * @private
 * @param {Object} props
 * @param {function} props.children - Children components passed to the Provider
 *
 */
// eslint-disable-next-line no-unused-vars
const MemoChildren = React.memo(props => <>{props.children}</>)

/**
 * Websocket Provider component. Should wrap a react application as a Provider
 * @function
 * @public
 * @export
 * @param {Object} props
 * @param {function} props.reducer - Custom websocket reducer function
 * @param {Object} props.initialState - Custom initial state for the reducer
 *
 * @returns {Object} sockr model object
 */
export const SockrProvider = props => {
  const { children, config, reducer, token, debug } = props

  const websocket = useSockrReducer(reducer, config || noOpObj)

  // Only init the websocket on initial render
  // Don't update the websocket after that
  // All config values must be setup from the start
  useEffect(() => {
    WSService &&
      !WSService.socket &&
      WSService.initSocket(websocket, token, debug)

    return () => !isDev && WSService.disconnect()
  }, [])

  return (
    <SocketContext.Provider value={websocket}>
      <MemoChildren>{children}</MemoChildren>
    </SocketContext.Provider>
  )
}
