import { WSService } from '../service'
import { SocketContext } from './context'
import { noOp, noOpObj } from '@keg-hub/jsutils'
import React, { useEffect } from 'react'
import { useSocketReducer } from '../reducer/useSocketReducer'

const isDev = process.env.NODE_ENV === 'development'

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
export const WebSocketProvider = props => {
  const { children, config, initialState, reducer, token } = props

  const websocket = useSocketReducer(
    reducer || noOp,
    initialState || noOpObj,
    config || noOpObj
  )

  useEffect(() => {
    WSService && !WSService.socket && WSService.initSocket(websocket, token)

    return () => !isDev && WSService.disconnect()
  }, [])

  return (
    <SocketContext.Provider value={websocket}>
      <>{children}</>
    </SocketContext.Provider>
  )
}
