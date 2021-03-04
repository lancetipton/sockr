import { noOpObj } from '@keg-hub/jsutils'
import { setId } from './setId'
import { setCmds } from './setCmds'

export const init = (data=noOpObj, service=noOpObj) => {
  setCmds(data, service)
  setId(data, service)
}