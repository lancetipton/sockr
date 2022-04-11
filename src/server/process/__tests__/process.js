const { Process } = require('../process')

const sockrReducer = jest.fn()
const customReducer = jest.fn()

jest.resetModules()
jest.resetAllMocks()
jest.clearAllMocks()

describe('Process', () => {
  beforeEach(() => {
    sockrReducer.mockClear()
    customReducer.mockClear()
  })

  test('should not error', () => {
    expect(() => {
      const proc = new Process()
    }).not.toThrow()
  })

  test('should not error have debugError and debugEvent methods', () => {
    const proc = new Process()
    expect(() => {
      proc.debugError({ message: 'error message' }, 'Sockr message')
      proc.debugEvent('Test-Event', 'Sockr Event message')
    }).not.toThrow()
  })
})
