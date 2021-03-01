import { noOpObj } from '@keg-hub/jsutils'
import { setId } from './setId'
import { setCmds } from './setCmds'
import { onConnected } from './onConnected'

export const init = (data=noOpObj, service=noOpObj) => {
  onConnected(data, service)
  setCmds(data, service)
  setId(data, service)
}