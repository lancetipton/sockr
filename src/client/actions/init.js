import { setId } from './setId'
import { setCmds } from './setCmds'
import { onConnected } from './onConnected'


export const init = (data, service) => {
  onConnected(message, service)
  setCmds(message, service)
  setId(message, service)
}