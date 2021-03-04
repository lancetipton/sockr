import { getDispatch } from '../reducer/sockrState'
import { EventTypes } from '../../constants/eventTypes'

export const toggleIsRunning = ({ isRunning, name }) => {
  getDispatch()({
    type: EventTypes.RUNNING,
    isRunning,
    name,
  })
}

export {
  toggleIsRunning as cmdEnd,
  toggleIsRunning as cmdRunning,
}