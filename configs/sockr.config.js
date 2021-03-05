const sockrConfig = {
  groups: {
    default: {
      filters: {},
      commands: {
        development: {
          /** Add named commands here */
          example: {
            icon: 'example-icon',
            description: 'Demo command that prints the current directory',
            cmd: 'ls',
            params: [
              {
                name: 'demo-string',
                withKey: true,
                description: 'Demo string param',
                type: 'string',
                required: true,
                value: '',
              },
              {
                name: 'demo-array',
                withKey: true,
                description: 'Demo array param',
                type: 'array',
                required: true,
                value: ['test', 'test-2'],
              },
            ],
          },
        },
        production: {},
      },
    },
  },
}

module.exports = {
  sockrConfig,
}
