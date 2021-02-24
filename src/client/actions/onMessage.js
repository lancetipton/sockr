import { EventTypes } from '../../constants/eventTypes'

export const onMessage = (data, { dispatch }) => {
  return (
    data &&
    data.message &&
    dispatch({
      type: EventTypes.ON_MESSAGE,
      ...data,
    })
  )
}

export {
  onMessage as cmdOut,
  onMessage as cmdErr
}