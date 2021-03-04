const path = require('path')
const { deepMerge, noOpObj } = require('@keg-hub/jsutils')
const { sharedConfig } = require('./shared.config')
const { sockrConfig } = require('./sockr.config.js')

// Config settings for the backend server only
const serverConfig = deepMerge(sockrConfig, sharedConfig, {
  process: {},
})

module.exports = {
  serverConfig,
}
