import { deepFreeze, keyMirror } from '@ltipton/jsutils'

const TAG_PREFIX = 'SOCKr'

export const EventTypes = deepFreeze(keyMirror([
  // General
  `${TAG_PREFIX}:INIT`,

    // Auth
  `${TAG_PREFIX}:AUTH_TOKEN`,
  `${TAG_PREFIX}:NOT_AUTHORIZED`,

  // Peer
  `${TAG_PREFIX}:ADD_PEER`,
  `${TAG_PREFIX}:PEER_DISCONNECT`,

  // Command
  `${TAG_PREFIX}:RUN_CMD`,
  `${TAG_PREFIX}:CMD_RUNNING`,
  `${TAG_PREFIX}:CMD_END`,
  `${TAG_PREFIX}:CMD_OUT`,
  `${TAG_PREFIX}:CMD_ERR`,
  `${TAG_PREFIX}:CMD_FAIL`,

], true))