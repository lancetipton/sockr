require('module-alias/register')
require('dotenv').config()

const express = require('express')
const { sockr } = require('@ltipton/sockr/server')
const { checkCall } = require('@keg-hub/jsutils')
const config = require('../../configs/server.config')

// Start express server, and connect to sockr
module.exports = () =>
  checkCall(() => {
    const app = express()

    //Set which port to listen on
    app.set('port', config.port || process.env.PORT || 9090)

    const server = app.listen(app.get('port'), () => {
      const address = server.address().address
      const host = address === '::' ? 'localhost' : address
      const port = server.address().port

      console.log(`Listening at http://${host}:${port}`)
    })

    // { path: get(config, 'websocket.paths.socket', "/socket") }
    sockr(server, config)

    return server
  })
