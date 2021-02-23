import { WSService } from '../service'
import { SocketContext } from './context'
import { noOp, noOpObj } from '@keg-hub/jsutils'
import React, { useEffect, useContext } from 'react'
import { useSocketReducer } from '../reducer/useSocketReducer'

const isDev = process.env.NODE_ENV === 'development'

/**
 * Websocket HOC component that initialized the websocket
 * @function
 * @public
 * @export
 * @param {Object} props
 * @param {function} props.socketReducer - Custom websocket reducer function
 * @param {Object} props.socketState - Custom initial state for the reducer
 *
 * @returns {Object} sockr model object
 */
export const WebSocketComp = props => {
  const { token, children, config = noOpObj } = props
  const websocket = useContext(SocketContext)

  useEffect(() => {
    !WSService.socket && WSService.initSocket(config, token)

    return () => !isDev && WSService.disconnect()
  }, [token])

  return <>{children}</>
}

/**
 * Websocket Provider component. Should wrap a react application as a Provider
 * @function
 * @public
 * @export
 * @param {Object} props
 * @param {function} props.reducer - Custom websocket reducer function
 * @param {Object} props.initialState - Custom initial state for the reducer
 * @param {Object} props.config - Websocket config object matching the config spec
 *
 * @returns {Object} sockr model object
 */
export const WebSocket = props => {
  const websocket = useSocketReducer(
    props.reducer || noOp,
    props.initialState || noOpObj
  )

  return (
    <SocketContext.Provider value={websocket}>
      <WebSocketComp {...props} />
    </SocketContext.Provider>
  )
}
