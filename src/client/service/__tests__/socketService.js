import { authTokenHeader } from '../../constants'

jest.resetModules()
jest.resetAllMocks()
jest.clearAllMocks()

const mockSocket = {
  on: jest.fn(),
}

const ioMock = jest.fn((endpoint, config) => {
  return mockSocket
})

jest.setMock('socket.io-client', ioMock)

const config = {
  host: `0.0.0.0`,
  port: `1234`,
  namespace: `test`,
  path: `sockr-socket`,
  ioConfig: {
    extraHeaders: {
      testHeader: `test-header`,
    },
  },
}

const { WSService } = require('../socketService')

describe('WSService', () => {
  beforeEach(() => {
    ioMock.mockClear()
    WSService.socket = undefined
  })

  describe('WSService.initSocket', () => {
    test(`should not error`, () => {
      expect(() => {
        const service = WSService.initSocket(config)
      }).not.toThrow()
    })

    test(`build call io with the correct config`, () => {
      WSService.initSocket(config)
      const [url, conf] = ioMock.mock.calls[0]
      expect(url).toBe(`https://0.0.0.0:1234/test`)
      expect(conf).toEqual({
        path: 'sockr-socket',
        transports: ['websocket', 'polling', 'flashsocket'],
        extraHeaders: { testHeader: 'test-header' },
      })
    })

    test(`should merge the ioConfig option and token when passed`, () => {
      WSService.initSocket(config, `123456`)
      const [url, conf] = ioMock.mock.calls[0]
      expect(conf.extraHeaders[authTokenHeader]).toBe(`123456`)
    })
  })
})
