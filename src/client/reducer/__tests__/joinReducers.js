import { joinReducers } from '../joinReducers'

const sockrReducer = jest.fn()
const customReducer = jest.fn()

jest.resetModules()
jest.resetAllMocks()
jest.clearAllMocks()

describe('joinReducers', () => {
  beforeEach(() => {
    sockrReducer.mockClear()
    customReducer.mockClear()
  })

  test(`should not error`, () => {
    expect(() => {
      joinReducers(sockrReducer, customReducer)
    }).not.toThrow()
  })

  test(`should return a function`, () => {
    const func = joinReducers(sockrReducer, customReducer)
    expect(typeof func).toBe('function')
  })

  test(`should call both reducers when they exist`, () => {
    expect(sockrReducer).not.toHaveBeenCalled()
    expect(customReducer).not.toHaveBeenCalled()

    const func = joinReducers(sockrReducer, customReducer)
    func({}, {})

    expect(sockrReducer).toHaveBeenCalled()
    expect(customReducer).toHaveBeenCalled()
  })

  test(`should not throw when no custom reducer is passed`, () => {
    expect(() => {
      joinReducers(sockrReducer)
    }).not.toThrow()
  })
})
