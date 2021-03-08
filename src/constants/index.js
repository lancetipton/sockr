const { EventTypes, tagPrefix } = require('./eventTypes')
const { deepFreeze } = require('@keg-hub/jsutils')

module.exports = {
  tagPrefix,
  EventTypes: deepFreeze(EventTypes),
}
