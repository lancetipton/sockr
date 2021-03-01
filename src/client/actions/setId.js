import { getDispatch } from '../reducer/sockrState'
import { EventTypes } from '../../constants/eventTypes'

export const setId = ({ id, data, isRunning }) => {
  getDispatch()({
    type: EventTypes.SET_ID,
    id,
    isRunning,
    ...data,
  })
}
