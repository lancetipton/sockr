# SockR
* Wrapper around socket.io for the server and client

## Outline
- [SockR][#sockr]
  - [Outline](#outline)
  - [Install](#install)
  - [Dependencies](#dependencies)
  - [Use](#use)

## Install
* With NPM - `npm install @ltipton/parkin`
* With Yarn - `yarn add @ltipton/parkin`

## Dependencies
* [socket.io](https://www.npmjs.com/package/socket.io)
* [@keg-hub/spawn-cmd](https://www.npmjs.com/package/@keg-hub/spawn-cmd)

## Use
**Backend**
```js
const express = require('express')
const { sockr } = require('@ltipton/sockr/server')

// Create the app, using express in this example
const app = express()

// Set which port to listen on
app.set('port', config.port || process.env.PORT || 9090)

// Start the express server on the defined port
const server = app.listen(app.get('port'), () => {
  const address = server.address().address
  const host = address === '::' ? 'localhost' : address
  const port = server.address().port

  console.log(`Listening at http://${host}:${port}`)
})

// Connect the server to sockr, and pass in your sockr config
sockr(server, { /* ...config object */ })

```

## Specs
* Sockr accepts a second argument, which should be an object adhering to the following specs

### Backend Config
```ts
{
  socket: <Object> {
    path: <String> 'Exposed endpoint of the websocket',
  },
  commands: <Commands> /* Commands Model */,
  filters: <Filters> /* Filters Model */,
  process: <Process> /* Process Model */,
}
```
### Commands Model
```ts
{
  `<Group Key>`: <Object> { /* Group settings and commands the server is allowed to run */
    filters: <Object> { /* String filters separated by command name */
      all: <Array> [ /* Filters applied to all commands in the group */
        <String> /* Filter string matching the command output to filter out */
      ],
      `<Command Name>`: <Array> [ /* Filters applied to a specific command */
        <String> /* Filter string matching the command output to filter out */
      ]
    },
    commands: <Object> { /* Commands within the group */
      `<Command Name>`: <Command> /* Command model */
    }
  }
}
```

### Command Model
```ts

```

### Filters Model
```ts
```

### Process Model
```ts
{
  command: <Object> { /* Settings for executing commands from a socket request */
    default: <String> /* Default command run by the child process */ ('/bin/bash'),
    overrides: <Array> [ /*Group of commands that can override the default*/
      <String> /*Command that is allow to override the default command*/
    ],
  },
  exec: <Object> { /* Settings to pass on to the spawned child_process */ },
  root: <String> /* Working directory of the spawned child_process */ (process.cwd()),
  script: <String> /* Default Script run by the spawned child_process */ (scripts/exec.sh),
}
```