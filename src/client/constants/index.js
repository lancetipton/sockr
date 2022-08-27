// This is a work-around due to rollup adding jsutils as a default export
// We do the deepFreeze here instead of in the shared constants file
// This works around module.exports vs exports issues
import { deepFreeze } from '@keg-hub/jsutils'
import {
  EventTypes,
  tagPrefix,
  authTokenHeader,
} from '../../constants/eventTypes'
const frozenEvents = deepFreeze(EventTypes)

export { tagPrefix, authTokenHeader, frozenEvents as EventTypes }
