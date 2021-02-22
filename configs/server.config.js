import sockrConfig from './sockr.config.js'
import { deepMerge } from "@keg-hub/jsutils"

export const config = deepMerge(sockrConfig, {
  // Config settings for the backend server only
})
