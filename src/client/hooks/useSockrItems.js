import { useMemo, useRef } from 'react'
import { getState } from '../reducer/sockrState'
import { get, noPropArr, clearObj, eitherArr } from '@keg-hub/jsutils'

/**
 * Hook to extract a single values from the sockr state object
 * Memoizes the extracted values and returns them as an object
 * Only updates the values when the store property matching a key statePaths has updated
 * This avoids re-renders when the state object has change, but a value has not
 * @function
 * @public
 * @export
 * @returns {Array} statePaths - Paths to values on the current sockr state
 *
 * @returns {Object} Memoize values from the state
 */
export const useSockrItems = (findPaths = noPropArr) => {
  // Ensure we have an array to call reduce on
  const statePaths = eitherArr(findPaths, [findPaths])

  // Get the current state to allow pulling the values with statePaths
  const state = getState()

  // Memoize the current values from the state at statePaths
  // If the state updates, but not the values from statePaths,
  // then this hook with run, but the returned values will be the same
  // Or it will get the updated values when the state has changes
  // Either way, the values should always be the correct values in the state
  const values = useMemo(() => {
    return statePaths.reduce((found, valPath) => {
      found[valPath] = get(state, valPath)

      return found
    }, {})
  }, [ state, statePaths ])

  // Init the sockrRef to store the initial value
  const sockrRef = useRef(values)

  // Memoize the values and sockrRef.current
  // Loop each property in values and
  // Update sockrRef.current to the current state value
  // Then return sockrRef.current
  // This way the values are only ever updated it it's they changed on that state changed
  // If the state object changes, but not the values, then the original values are returned
  return useMemo(() => {
    // Clear out all keys from the current ref
    // This also keeps the same identity of the ref object
    // Which means we should check the children for updates, not the root object
    clearObj(sockrRef.current)

    // Loop the values and add the current values to the ref
    // This puts back any values we removed in the clearObj method call
    // If the value never changed, then the ref should have the same value again
    // But it removes any properties that should not longer exist
    Object.entries(values).map(
      ([ key, value ]) => (sockrRef.current[key] = value)
    )

    return sockrRef.current
  }, [ values, sockrRef && sockrRef.current ])
}
