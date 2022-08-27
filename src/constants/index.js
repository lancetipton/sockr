const { EventTypes, tagPrefix, authTokenHeader } = require('./eventTypes')
const { deepFreeze } = require('@keg-hub/jsutils')

module.exports = {
  tagPrefix,
  authTokenHeader,
  EventTypes: deepFreeze(EventTypes),
}
