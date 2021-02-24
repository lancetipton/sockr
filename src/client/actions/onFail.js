import { toggleIsRunning } from './toggleIsRunning'
import { EventTypes } from '../../constants/eventTypes'

export const onFail = (data, service) => {
  return (
    data &&
    data.message &&
    service.dispatch({
      type: EventTypes.ON_MESSAGE,
      ...data,
    })
  )

  toggleIsRunning(data, service)
}

export {
  onFail as cmdFail
}