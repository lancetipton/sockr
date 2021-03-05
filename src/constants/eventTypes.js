const { deepFreeze } = require('@keg-hub/jsutils')

const TAG_PREFIX = 'SOCKr'

const EventTypes = deepFreeze({
  // General
  INIT: `${TAG_PREFIX}:INIT`,
  SET_ID: `${TAG_PREFIX}:SET_ID`,
  CONNECT: `${TAG_PREFIX}:CONNECT`,

  // STORE
  UPDATE_STORE: `${TAG_PREFIX}:UPDATE_STORE`,

  // Auth
  AUTH_TOKEN: `${TAG_PREFIX}:AUTH_TOKEN`,
  NOT_AUTHORIZED: `${TAG_PREFIX}:NOT_AUTHORIZED`,

  // Peer
  ADD_PEER: `${TAG_PREFIX}:ADD_PEER`,
  PEER_DISCONNECT: `${TAG_PREFIX}:PEER_DISCONNECT`,

  // Command
  SET_CMDS: `${TAG_PREFIX}:SET_CMDS`,
  RUN_CMD: `${TAG_PREFIX}:RUN_CMD`,
  CMD_RUNNING: `${TAG_PREFIX}:CMD_RUNNING`,
  CMD_END: `${TAG_PREFIX}:CMD_END`,
  CMD_OUT: `${TAG_PREFIX}:CMD_OUT`,
  CMD_ERR: `${TAG_PREFIX}:CMD_ERR`,
  CMD_FAIL: `${TAG_PREFIX}:CMD_FAIL`,
})

module.exports = {
  EventTypes,
  tagPrefix: TAG_PREFIX,
}
