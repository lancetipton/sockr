import React, { useContext, useMemo, useRef, useReducer, useEffect } from 'react';
import jsutils, { noPropArr, eitherArr, get, clearObj, noOpObj, snakeCase, isFunc, checkCall, isObj, camelCase, deepMerge } from '@keg-hub/jsutils';
import io from 'socket.io-client';

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

const SocketContext = React.createContext(null);

const useSockr = () => {
  return useContext(SocketContext);
};

const SockrHoc = Component => {
  const websocket = useSockr();
  return props => React.createElement(Component, _extends({}, props, {
    websocket: websocket
  }));
};

let _SOCKR_STATE;
let _SOCKR_DISPATCH = () => console.warn(`Sockr Dispatch has not been initialized!`);
const getState = () => _SOCKR_STATE;
const getDispatch = () => _SOCKR_DISPATCH;
const setNextState = next => {
  _SOCKR_STATE = next;
};
const setDispatch = dispatch => {
  _SOCKR_DISPATCH = dispatch;
};

const useSockrItems = (findPaths = noPropArr) => {
  const statePaths = eitherArr(findPaths, [findPaths]);
  const state = getState();
  const values = useMemo(() => {
    return statePaths.reduce((found, valPath) => {
      found[valPath] = get(state, valPath);
      return found;
    }, {});
  }, [state, statePaths]);
  const sockrRef = useRef(values);
  return useMemo(() => {
    clearObj(sockrRef.current);
    Object.entries(values).map(([key, value]) => sockrRef.current[key] = value);
    return sockrRef.current;
  }, [values, sockrRef && sockrRef.current]);
};

const {
  deepFreeze
} = jsutils;
const TAG_PREFIX = 'SOCKr';
const EventTypes = deepFreeze({
  INIT: `${TAG_PREFIX}:INIT`,
  SET_ID: `${TAG_PREFIX}:SET_ID`,
  CONNECT: `${TAG_PREFIX}:CONNECT`,
  UPDATE_STORE: `${TAG_PREFIX}:UPDATE_STORE`,
  AUTH_TOKEN: `${TAG_PREFIX}:AUTH_TOKEN`,
  NOT_AUTHORIZED: `${TAG_PREFIX}:NOT_AUTHORIZED`,
  ADD_PEER: `${TAG_PREFIX}:ADD_PEER`,
  PEER_DISCONNECT: `${TAG_PREFIX}:PEER_DISCONNECT`,
  SET_CMDS: `${TAG_PREFIX}:SET_CMDS`,
  RUN_CMD: `${TAG_PREFIX}:RUN_CMD`,
  CMD_RUNNING: `${TAG_PREFIX}:CMD_RUNNING`,
  CMD_END: `${TAG_PREFIX}:CMD_END`,
  CMD_OUT: `${TAG_PREFIX}:CMD_OUT`,
  CMD_ERR: `${TAG_PREFIX}:CMD_ERR`,
  CMD_FAIL: `${TAG_PREFIX}:CMD_FAIL`
});
var eventTypes = {
  EventTypes,
  tagPrefix: TAG_PREFIX
};
var eventTypes_1 = eventTypes.EventTypes;
var eventTypes_2 = eventTypes.tagPrefix;

const addPeer = ({
  id,
  peers
}) => {
  return getDispatch()({
    type: eventTypes_1.ADD_PEER,
    id,
    peers
  });
};

const setId = ({
  id,
  data,
  isRunning
}) => {
  getDispatch()({
    type: eventTypes_1.SET_ID,
    id,
    isRunning,
    ...data
  });
};

const setCmds = ({
  data: {
    commands
  }
}) => {
  return getDispatch()({
    commands,
    type: eventTypes_1.SET_CMDS
  });
};

const init = (data = noOpObj, service = noOpObj) => {
  setCmds(data);
  setId(data);
};

const connect = () => {
  return getDispatch()({
    type: eventTypes_1.CONNECT,
    connected: true
  });
};

const toggleIsRunning = ({
  isRunning,
  name
}) => {
  getDispatch()({
    type: eventTypes_1.RUNNING,
    isRunning,
    name
  });
};

const cmdEnd = data => {
  return data && data.message && getDispatch()({
    type: eventTypes_1.CMD_END,
    ...data
  });
};

const cmdErr = data => {
  data && data.message && getDispatch()({
    type: eventTypes_1.CMD_ERR,
    ...data
  });
};

const cmdFail = (data, service) => {
  return data && data.message && getDispatch()({
    type: eventTypes_1.CMD_FAIL,
    ...data
  });
};

const cmdOut = data => {
  data && data.message && getDispatch()({
    type: eventTypes_1.CMD_OUT,
    ...data
  });
};

const peerDisconnect = ({
  id,
  peers
}) => {
  return getDispatch()({
    type: eventTypes_1.DISCONNECT_PEER,
    id,
    peers
  });
};

var InternalActions = /*#__PURE__*/Object.freeze({
  __proto__: null,
  addPeer: addPeer,
  init: init,
  connect: connect,
  cmdEnd: cmdEnd,
  cmdErr: cmdErr,
  cmdFail: cmdFail,
  cmdOut: cmdOut,
  peerDisconnect: peerDisconnect,
  setId: setId,
  setCmds: setCmds,
  toggleIsRunning: toggleIsRunning
});

const buildEndpoint = config => {
  const protocol = get(window, 'location.protocol', 'https:');
  return config.port ? `${protocol}//${config.host}:${config.port}` : config.host;
};
const checkCallEvent = (action, message, instance, event) => {
  return checkCall(action, message, instance, event);
};
const callAction = (instance, event, action) => {
  const eventName = camelCase((event.split(':')[1] || '').toLowerCase());
  return data => {
    if (!eventName) return instance.logData(`Invalid event name!`, event);
    const message = data && JSON.parse(data);
    instance.logEvent(event, message);
    eventName === 'init' && (instance.commands = get(message, 'data.commands'));
    const internal = InternalActions[eventName];
    internal && checkCallEvent(internal, message, instance, event);
    const customEvent = get(instance.config, `events.${eventName}`);
    customEvent && checkCallEvent(customEvent, message, instance, event);
    const allEvent = get(instance.config, `events.all`);
    allEvent && checkCallEvent(allEvent, message, instance, event);
  };
};
const getCommand = (commands, cmdOrId) => {
  const cmdId = isObj(cmdOrId) ? cmdOrId.id : cmdOrId;
  return Object.entries(commands).reduce((found, [group, subCmds]) => {
    return found ? found : Object.entries(subCmds).reduce((subFound, [name, definition]) => {
      return !subFound && isObj(definition) && definition.id === cmdId ? definition : subFound;
    }, false);
  }, false);
};
class SocketService {
  constructor() {
    _defineProperty(this, "emit", (event, data) => {
      if (!this.socket) return console.error(`Socket not connected, cannot emit socket event!`);
      if (!event) return console.error(`Event type is missing, cannot emit socket event without an event type!`, event);
      this.logData(`Sending Socket Event: ${event}`, data);
      this.socket.emit(event, data);
    });
    _defineProperty(this, "disconnect", () => {
      if (!this.socket) return this.logData(`Socket already disconnected!`);
      this.logData(`Disconnecting from Socket!`);
      this.socket.disconnect();
      this.socket = undefined;
      this.config = undefined;
      this.dispatch = undefined;
    });
  }
  logData(...data) {
    this.logDebug && console.log(...data);
  }
  logEvent(event, ...data) {
    this.logDebug && console.log(`Socket Event: ${event}`, ...data);
  }
  initSocket(config, token, logDebug = false) {
    if (this.socket) return;
    this.config = config;
    this.logDebug = logDebug;
    const endpoint = buildEndpoint(config);
    this.logData(`Connecting to backend socket => ${endpoint}${config.path}`);
    this.socket = io(endpoint, {
      path: config.path,
      transports: ['websocket', 'polling', 'flashsocket']
    });
    this.addEvents(token);
  }
  addEvents(token) {
    if (!this.socket) return;
    Object.entries(get(this.config, 'events', noOpObj)).map(([name, action]) => {
      const namCaps = snakeCase(name).toUpperCase();
      if (namCaps === 'ALL') return;
      const eventType = `${eventTypes_2}:${namCaps}`;
      isFunc(action) && !eventTypes_1[namCaps] && this.socket.on(eventType, callAction(this, eventType));
    });
    Object.entries(eventTypes_1).map(([key, eventType]) => {
      this.socket.on(eventType, callAction(this, eventType));
    });
    this.socket.on(`connect`, this.onConnection.bind(this, token));
  }
  onConnection(token, data) {
    const connectAction = callAction(this, `${eventTypes_2}:CONNECT`);
    connectAction(data);
  }
  runCommand(command, params) {
    const {
      id,
      cmd,
      name,
      group
    } = getCommand(this.commands, command);
    return this.emit(eventTypes_1.RUN_CMD, {
      id,
      cmd,
      name,
      group,
      params
    });
  }
}
const WSService = new SocketService();

const initialState = {
  connected: false,
  peers: [],
  id: null,
  runningCmd: null,
  isRunning: false,
  server: noOpObj,
  events: noOpObj
};
const sockrReducer = (state = initialState, action) => {
  if (!state || !action || !action.type) return state;
  switch (action.type) {
    case eventTypes_1.CONNECT:
      {
        return action.connected === state.connected ? state : { ...state,
          connected: true
        };
      }
    case eventTypes_1.SET_ID:
      {
        const {
          type,
          ...updates
        } = action;
        return !action.id ? state : { ...state,
          ...updates
        };
      }
    case eventTypes_1.RUNNING:
      {
        return action.isRunning === state.isRunning ? state : { ...state,
          runningCmd: action.isRunning && action.name || null,
          isRunning: action.isRunning
        };
      }
    case eventTypes_1.ADD_PEER:
      {
        return !action.peers ? state : { ...state,
          peers: action.peers
        };
      }
    case eventTypes_1.DISCONNECT_PEER:
      {
        return !action.peers ? state : { ...state,
          peers: action.peers
        };
      }
    default:
      {
        return state;
      }
  }
};

let _JOINED_REDUCERS;
const joinReducers = (sockrReducer, customReducer) => {
  if (_JOINED_REDUCERS) return _JOINED_REDUCERS;
  _JOINED_REDUCERS = (state, action) => {
    const updatedState = sockrReducer(state, action);
    return customReducer(updatedState, action);
  };
  return _JOINED_REDUCERS;
};

const initialState$1 = sockrReducer();
setNextState(initialState$1);
const useSockrReducer = (customReducer, customInitialState) => {
  const [state, dispatch] = useReducer(joinReducers(sockrReducer, customReducer), deepMerge(initialState$1, customInitialState));
  getState() !== state && setNextState(state);
  getDispatch() !== dispatch && setDispatch(dispatch);
  return state;
};

const isDev = process.env.NODE_ENV === 'development';
const MemoChildren = React.memo(props => React.createElement(React.Fragment, null, props.children));
const SockrProvider = props => {
  const {
    children,
    config,
    reducer,
    token,
    debug
  } = props;
  const websocket = useSockrReducer(reducer, config || noOpObj);
  useEffect(() => {
    WSService && !WSService.socket && WSService.initSocket(websocket, token, debug);
    return () => !isDev && WSService.disconnect();
  }, []);
  return React.createElement(SocketContext.Provider, {
    value: websocket
  }, React.createElement(MemoChildren, null, children));
};

var constants = { ...eventTypes
};

const {
  EventTypes: EventTypes$1,
  tagPrefix
} = constants;

export { EventTypes$1 as EventTypes, SocketService, SockrHoc, SockrProvider, WSService, tagPrefix, useSockr, useSockrItems };
//# sourceMappingURL=index.js.map
