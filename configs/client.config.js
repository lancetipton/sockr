import { sharedConfig } from './shared.config'
import { deepMerge } from '@keg-hub/jsutils'

export const config = deepMerge(sharedConfig, {
  // Config settings for the client frontend only
})
