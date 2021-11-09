# SockR
* Wrapper around socket.io for the server and client

## Outline
- [SockR][#sockr]
  - [Outline](#outline)
  - [Install](#install)
  - [Dependencies](#dependencies)
  - [Use](#use)

## Install
* With NPM - `npm install @ltipton/sockr`
* With Yarn - `yarn add @ltipton/sockr`

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

## Backend Config
```ts
{
  socket: <Object> {
    path: <String> 'Exposed endpoint of the websocket',
  },
  commands: <Commands> /* See Commands Model */,
  filters: <Filters> /* See Filters Model */,
  process: <Process> /* See Process Model */,
  events: <Events> /* See Events Model */
}
```
### Commands Model
```ts
{
  /* Other config properties */,
  ...config,

  /* Commands Model */
  commands: {
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
}
```

### Filters Model
```ts
{
/* Other config properties */,
  ...config,

  /* Filters Model */
  filters: {
    /*  TODO */
  }
}
```

### Process Model
```ts
{
/* Other config properties */,
  ...config,

  /* Process Model */
  process: {
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
}
```

### Events Model
```ts
{
  ...config,
  events: {
    <event-name>: () => { /* do something */ }
  }
}
```
**Notes**
* Events property should be an object containing
  * `key => value` pairs matching `event-name => event-function`
* It allows you to pass in custom socket events that tie into socket.ios event listener `socket.on`
  * So that when the event is emitted by the client or sockr, the function will be called
* Some events are called by default by sockr for specific event. These events include
  * `connection`: Called when a socket.io socket connects to the server => `socket.on('connection')`

**Event Name**
* The event name should formatted as **camelCase**, and the first letter should be lowercase
  * Example
    * **Good** - `myCustomEvent: () => {}`,
    * **BAD** - `My-Custom-EVENT: () => {}`,

**Event Function**
* The event function is passed an object with the following properties
```ts
{
  data: <Param> /* Params passed to the event when it fired */,
  socket: <Socket.io Socket Instance> /* Socket the fired / relates to the event */,
  config: <Sockr Config> /* Passed on Sockr Initialization */,
  Manager:<Sockr Manager Instance> /* See Manager */,
  io: <Socket.io Server Instance>,
}
```