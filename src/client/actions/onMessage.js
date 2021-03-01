import { getDispatch } from '../reducer/sockrState'
import { EventTypes } from '../../constants/eventTypes'

export const onMessage = data => {
  return (
    data &&
    data.message &&
    getDispatch()({
      type: EventTypes.ON_MESSAGE,
      ...data,
    })
  )
}

export {
  onMessage as cmdOut,
  onMessage as cmdErr
}