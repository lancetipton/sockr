const { sockrConfig } = require('./sockr.config.js')
const { deepMerge } = require('@keg-hub/jsutils')

const serverConfig = deepMerge(sockrConfig, {
  // Config settings for the backend server only
  socket: {
    host: '0.0.0.0',
  },
})

module.exports = {
  serverConfig,
}
