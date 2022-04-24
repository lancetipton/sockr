const { Manager, SocketManager } = require('../manager')
const { EventTypes, tagPrefix } = require('../../../constants')

jest.resetModules()
jest.resetAllMocks()
jest.clearAllMocks()

describe('SocketManager', () => {
  describe('formatTag', () => {
    it(`should auto return values matching any of the EventTypes`, () => {
      Object.values(EventTypes).map(val =>
        expect(Manager.formatTag(val)).toBe(val)
      )
    })
  })
})
