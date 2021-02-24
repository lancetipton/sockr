import { EventTypes } from '../../../constants/eventTypes'

export const toggleIsRunning = ({ isRunning, name }, { dispatch }) => {
  dispatch({
    type: EventTypes.IS_RUNNING,
    isRunning,
    name,
  })
}
