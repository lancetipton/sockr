export const sockrConfig = {
  socket: {
    path: '/socket',
  },
  process: {},
  groups: {
    default: {
      filters: {},
      commands: {
        development: {
        /**
          Add named commands here
          example: {
            "group": "default",
            "icon": "example-icon",
            "description": "Prints a list of the current directory",
            "cmd": "ls",
            "params": [
              {
                "name": "bundle",
                "withKey": true,
                "description": "Can find this in Zerista Admin / native_app page. Uses reverse domain name notation. Example => com.zerista.zsales",
                "type": "string",
                "required": true,
                "value": ""
              },
              {
                "name": "env",
                "withKey": true,
                "description": "API endpoint the app points to. This is usually 'com'",
                "type": "array",
                "required": true,
                "value": [
                  "com",
                  "eu"
                ]
              }
            ]
          }
        */
        },
        production: {},
      },
    }
  },
}