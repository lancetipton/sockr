'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var SocketIO = require('socket.io');
var path = require('path');
var spawnCmd = require('@keg-hub/spawn-cmd');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var SocketIO__default = /*#__PURE__*/_interopDefaultLegacy(SocketIO);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);

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

const isArr = value => Array.isArray(value);

const isObj = obj => typeof obj === 'object' && !Array.isArray(obj) && obj !== null;

const isFunc = func => typeof func === 'function';

const deepFreeze = obj => {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).map(prop => {
    obj.hasOwnProperty(prop) && obj[prop] !== null && (typeof obj[prop] === 'object' || isFunc(obj[prop])) && !Object.isFrozen(obj[prop]) && deepFreeze(obj[prop]);
  });
  return obj;
};

const isStr = str => typeof str === 'string';

const noOpObj = Object.freeze({});
deepFreeze({
  content: {}
});
const noPropArr = deepFreeze([]);

const exists = value => value === value && value !== undefined && value !== null;

const isColl = val => typeof val === 'object' && val !== null;

const updateColl = (obj, path, type, val) => {
  const org = obj;
  if (!isColl(obj) || !obj || !path) return type !== 'set' && val || undefined;
  const parts = isArr(path) ? Array.from(path) : path.split('.');
  const key = parts.pop();
  let prop;
  let breakPath;
  while (prop = parts.shift()) {
    const next = obj[prop];
    isColl(next) || isFunc(next) ? obj = next : (() => {
      if (type === 'set') obj[prop] = {};else breakPath = true;
      obj = obj[prop];
    })();
    if (breakPath) return val;
  }
  return type === 'get' ? key in obj ? obj[key] : val : type === 'unset' ? delete obj[key] : (obj[key] = val) && org || org;
};
const get = (obj, path, fallback) => updateColl(obj, path, 'get', fallback);

const cloneFunc = func => {
  const funcClone = function (...args) {
    return func instanceof funcClone ? (() => {
      return new func(...args);
    })() : get(func.prototype, 'constructor.name') ? new func(...args) : func.apply(func, args);
  };
  for (let key in func) func.hasOwnProperty(key) && (funcClone[key] = func[key]);
  Object.defineProperty(funcClone, 'name', {
    value: func.name,
    configurable: true
  });
  funcClone.toString = () => func.toString();
  return funcClone;
};
const deepClone = (obj, hash = new WeakMap()) => {
  if (Object(obj) !== obj) return obj;
  if (obj instanceof Set) return new Set(obj);
  if (hash.has(obj)) return hash.get(obj);
  if (isArr(obj)) return obj.map(x => deepClone(x));
  if (isFunc(obj)) return cloneFunc(obj);
  const result = obj instanceof Date ? new Date(obj) : obj instanceof RegExp ? new RegExp(obj.source, obj.flags) : !obj.constructor ? Object.create(null) : null;
  if (result === null) return cloneObjWithPrototypeAndProperties(obj);
  hash.set(obj, result);
  if (obj instanceof Map) return Array.from(obj, ([key, val]) => result.set(key, deepClone(val, hash)));
  return Object.assign(result, ...Object.keys(obj).map(key => ({
    [key]: deepClone(obj[key], hash)
  })));
};
const cloneObjWithPrototypeAndProperties = objectWithPrototype => {
  if (!objectWithPrototype) return objectWithPrototype;
  const prototype = Object.getPrototypeOf(objectWithPrototype);
  const sourceDescriptors = Object.getOwnPropertyDescriptors(objectWithPrototype);
  for (const [key, descriptor] of Object.entries(sourceDescriptors)) {
    descriptor.value && (sourceDescriptors[key].value = deepClone(descriptor.value));
  }
  const clone = Object.create(prototype, sourceDescriptors);
  if (Object.isFrozen(objectWithPrototype)) Object.freeze(clone);
  if (Object.isSealed(objectWithPrototype)) Object.seal(clone);
  return clone;
};

const checkCall = (method, ...params) => isFunc(method) && method(...params) || undefined;
const uuid = a => a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, uuid);

const isEmptyColl = obj => isArr(obj) ? obj.length === 0 : isColl(obj) && Object.getOwnPropertyNames(obj).length === 0;

const deepMerge = (...sources) => {
  return sources.reduce((merged, source) => {
    const srcCopy = deepClone(source);
    return isArr(srcCopy) ? [...(isArr(merged) && merged || []), ...srcCopy] : isObj(srcCopy) ? Object.entries(srcCopy).reduce((joined, [key, value]) => ({ ...joined,
      [key]: isFunc(value) ? cloneFunc(value) : isColl(value) && key in joined ? deepMerge(joined[key], value) : deepClone(value)
    }), merged) : merged;
  }, isArr(sources[0]) && [] || {});
};
const keyMap = (arr, toUpperCase) => isArr(arr) && arr.reduce((obj, key) => {
  if (!isStr(key)) return obj;
  const use = toUpperCase && key.toUpperCase() || key;
  obj[use] = use;
  return obj;
}, {}) || {};

Array.from(['caller', 'callee', 'arguments', 'apply', 'bind', 'call', 'toString', '__proto__', '__defineGetter__', '__defineSetter__', 'hasOwnProperty', '__lookupGetter__', '__lookupSetter__', 'isPrototypeOf', 'propertyIsEnumerable', 'valueOf', 'toLocaleString']).concat(Object.getOwnPropertyNames(Object.prototype)).reduce((map, functionName) => {
  map[functionName] = true;
  return map;
}, {});

const TAG_PREFIX = 'SOCKr';
const EventTypes = deepFreeze(keyMap([
`${TAG_PREFIX}:INIT`,
`${TAG_PREFIX}:AUTH_TOKEN`, `${TAG_PREFIX}:NOT_AUTHORIZED`,
`${TAG_PREFIX}:ADD_PEER`, `${TAG_PREFIX}:PEER_DISCONNECT`,
`${TAG_PREFIX}:RUN_CMD`, `${TAG_PREFIX}:CMD_RUNNING`, `${TAG_PREFIX}:CMD_END`, `${TAG_PREFIX}:CMD_OUT`, `${TAG_PREFIX}:CMD_ERR`, `${TAG_PREFIX}:CMD_FAIL`], true));

const getTimeStamp = () => new Date().getTime();
const logError = (err = noOpObj, method) => {
  console.log(`[ Socket Error ] --- SocketManager.${method}`);
  err.stack && console.error(err.stack);
};
class SocketManager {
  constructor(opts = {}) {
    _defineProperty(this, "buildMessage", (message = noOpObj) => deepMerge({
      id: uuid(),
      message: '',
      error: false,
      data: noOpObj,
      group: 'all',
      name: 'general',
      isRunning: this.isRunning,
      timestamp: getTimeStamp()
    }, message));
    _defineProperty(this, "setAuth", auth => {
    });
    _defineProperty(this, "add", socket => {
      this.peers[socket.id] = socket;
      socket.on('disconnect', _ => this.onDisconnect(socket));
      return socket.id;
    });
    _defineProperty(this, "getId", sockOrId => isStr(sockOrId) && sockOrId || sockOrId.id);
    _defineProperty(this, "getSocket", id => this.peers[id]);
    _defineProperty(this, "toJsonStr", data => {
      try {
        return JSON.stringify(!isObj(data) && {
          data
        } || data);
      } catch (err) {
        logError(err, 'toJsonStr');
        return JSON.stringify({
          error: 'Error in SocketManager.toJsonStr'
        });
      }
    });
    _defineProperty(this, "emit", (socket, tag, data) => {
      try {
        if (isStr(socket)) socket = this.getSocket(socket);
        socket && isFunc(socket.emit) ? socket.emit(tag, this.toJsonStr(this.buildMessage(data))) : console.error(`A Socket with an emit method is required to emit events!`);
      } catch (err) {
        logError(err, 'emit');
      }
    });
    _defineProperty(this, "broadCastAll", (socket, tag, data) => {
      try {
        if (isStr(socket)) socket = this.getSocket(socket);
        socket && socket.broadcast && isFunc(socket.broadcast.emit) && socket.broadcast.emit(tag, this.toJsonStr(this.buildMessage(data)));
      } catch (err) {
        logError(err, 'broadCastAll');
      }
    });
    _defineProperty(this, "emitAll", (tag, data) => {
      try {
        if (!this.socketIo) return console.error(`Socket.IO is not set on SocketManager!`);
        if (!tag) return console.error(`SocketManager.emitAll requires an event tag as param 2!`);
        this.socketIo.emit(tag, this.toJsonStr(this.buildMessage(data)));
      } catch (err) {
        logError(err, 'emitAll');
      }
    });
    _defineProperty(this, "checkAuth", async (socket, message, cb) => {
      return checkCall(cb, this, socket, message);
    });
    _defineProperty(this, "setupSocket", (socket, commands) => {
      try {
        const id = this.add(socket);
        if (!id) return console.error('Could not add socket. No id returned.', socket, id);
        this.emit(socket, EventTypes.INIT, {
          id,
          data: {
            commands,
            peers: Object.keys(this.peers)
          },
          message: 'Server socket initialized!'
        });
        this.broadCastAll(socket, EventTypes.ADD_PEER, {
          id: socket.id,
          data: {
            peers: Object.keys(this.peers)
          }
        });
      } catch (err) {
        logError(err, 'setupSocket');
      }
    });
    _defineProperty(this, "disconnect", (socket, message, tag = EventTypes.NOT_AUTHORIZED) => {
      if (isStr(socket)) socket = this.getSocket(socket);
      if (!socket) return;
      this.emit(socket, tag, {
        message: message || 'Missing authorization. Please login!'
      });
      setTimeout(() => socket.disconnect(), 100);
    });
    _defineProperty(this, "onDisconnect", socket => {
      if (isStr(socket)) socket = this.getSocket(socket);
      try {
        if (!this.peers[socket.id]) return;
        delete this.peers[socket.id];
        this.emitAll(EventTypes.PEER_DISCONNECT, {
          id: socket.id,
          data: {
            peers: Object.keys(this.peers)
          }
        });
      } catch (err) {
        logError(err, 'onDisconnect');
        if (isObj(this.peers)) delete this.peers[socket.id];
      }
    });
    this.peers = {};
    this.socketIo;
    this.isRunning = false;
  }
}
const Manager = new SocketManager();

const defOpts = {
  gid: process.getgid(),
  uid: process.getuid(),
  env: process.env,
  stdio: 'pipe'
};
const exec = (cmd, args = noPropArr, opts = noOpObj, cwd, env = noOpObj) => {
  return spawnCmd.spawnCmd(cmd, {
    args,
    cwd: cwd || opts.cwd || process.cwd(),
    options: { ...defOpts,
      ...opts,
      env: { ...defOpts.env,
        ...opts.env,
        ...env
      }
    }
  });
};

const CWD_REGEX = /^(\-\-)?(location|loc|workdir|cwd)\s/;
const shouldFilterMessage = args => {
  const {
    filters,
    data,
    group,
    cmd,
    commands
  } = args;
  if (!exists(data) || data === '') return true;
  const toFilter = [...filters.all, ...get(filters, [group], []), ...get(filters, [cmd], []), ...get(commands, [group, cmd, 'filters'], [])];
  return toFilter.reduce((shouldFilter, filter) => shouldFilter || new RegExp(filter, 'gi').test(data), false);
};
const addConfig = (cmd, params = noPropArr, config = noOpObj, events = noOpObj) => {
  const defCmd = get(config, 'command.default', '/bin/bash');
  const cmdOverrides = get(config, 'command.overrides', noPropArr);
  let cwd = get(config, 'root', process.cwd());
  params.map(param => {
    CWD_REGEX.test(param.trim()) && (cwd = param.match(CWD_REGEX)[3].trim());
  });
  const execOpts = { ...config.exec,
    ...events
  };
  if (cmdOverrides.includes(cmd)) return [cmd, params, execOpts, cwd];
  const scriptParams = [cmd, ...params];
  config.script && scriptParams.unshift(config.script);
  return [defCmd, params, execOpts, cwd];
};
const onInvalidCmd = (message, manager) => {
  const {
    name,
    cmd,
    id,
    params,
    group
  } = message;
  console.error('---------- Invalid command ----------');
  console.error(`group: ${group}`);
  console.error(`name: ${name}`);
  console.error(`cmd: ${cmd}`);
  console.error(`id: ${id}`);
  console.error(`params: ${params.join(' ')}`);
  console.error('---------- Invalid command ----------');
  manager.isRunning = false;
  manager.emitAll(EventTypes.CMD_FAIL, {
    name,
    error: true,
    isRunning: manager.isRunning,
    message: 'Failed to run command!'
  });
  return noOpObj;
};
const validateCmd = (message, commands, manager, config) => {
  if (!exists(commands) || isEmptyColl(commands)) return message;
  const {
    name,
    cmd,
    id,
    group
  } = message;
  const command = get(commands, [group, name]);
  return !command || command.cmd.indexOf(cmd) !== 0 || !id || id !== command.id ? onInvalidCmd(message, manager) : message;
};

class Process {
  constructor(commands, filters, config) {
    _defineProperty(this, "config", {
      command: {
        default: '/bin/bash',
        overrides: []
      },
      exec: noOpObj,
      root: process.cwd(),
      script: path__default['default'].join(__dirname, `../../../scripts/exec.sh`)
    });
    _defineProperty(this, "filterMessage", (data, group, name) => shouldFilterMessage({
      cmd,
      group,
      data: data.trim(),
      filters: this.filters,
      commands: this.commands
    }));
    _defineProperty(this, "stdOutEmit", (data, group, name) => {
      !this.filterMessage(data, group, name) && this.manager.emitAll(EventTypes.CMD_OUT, {
        name,
        group,
        message: data
      });
    });
    _defineProperty(this, "stdErrEmit", (data, group, name) => {
      !this.filterMessage(data, group, name) && this.manager.emitAll(EventTypes.CMD_ERR, {
        name,
        group,
        message: data
      });
    });
    _defineProperty(this, "onExitEmit", (code, group, name) => {
      this.manager.isRunning = false;
      this.manager.emitAll(EventTypes.CMD_END, {
        name,
        group,
        data: {
          exitCode: code
        }
      });
    });
    _defineProperty(this, "onErrorEmit", (err, group, name) => {
      const message = err.message.indexOf('ENOENT') !== -1 ? `[ SOCKr CMD ERROR ] - Command '${cmd}' does not exist!\n\nMessage:\n${err.message}` : `[ SOCKr CMD ERROR ] - Failed to run command!\n\nMessage:\n${err.message}`;
      if (this.filterMessage(err.message, group, name)) return;
      this.manager.isRunning = false;
      this.manager.emitAll(EventTypes.CMD_FAIL, {
        name,
        group,
        error: true,
        message: message
      });
    });
    _defineProperty(this, "buildEvents", (cmd, params, group, name) => {
      return {
        onExit: code => this.onExitEmit(code, group, name),
        onStdOut: data => this.stdOutEmit(data, group, name),
        onStdErr: data => this.stdErrEmit(data, group, name),
        onError: err => this.onErrorEmit(err, group, name)
      };
    });
    _defineProperty(this, "exec", message => {
      const {
        name,
        cmd,
        params,
        group
      } = message;
      this.manager.isRunning = true;
      this.manager.emitAll(EventTypes.CMD_RUNNING, {
        name,
        group,
        data: {
          cmd,
          params
        },
        message: 'Running command'
      });
      return exec(...addConfig(cmd, params, this.config, this.buildEvents(cmd, params, group, name)));
    });
    _defineProperty(this, "bindSocket", socket => {
      socket.on(EventTypes.RUN_CMD, message => {
        try {
          const message = validateCmd(message, this.commands, this.manager, this.config);
          return cmd && id && this.exec(message);
        } catch (err) {
          console.error(`[ SOCKr CMD ERROR ] - Error running command: ${cmd}`);
          console.error(e.stack);
          this.manager.isRunning = false;
          this.manager.emitAll(EventTypes.CMD_RUNNING, {
            name,
            group,
            error: true,
            message: `Error running command:\n${err.message}`
          });
        }
      });
    });
    this.commands = commands;
    this.filters = filters;
    this.manager = config.manager || Manager;
    this.config = deepMerge(this.config, config);
  }
}

const setupSocketCmds = (Proc, socket, content) => {
  Manager.setupSocket(socket, content.commands);
  Proc.bindSocket(socket);
};
const sockr = (server, content) => {
  const io = new SocketIO__default['default'](content.config);
  io.attach(server);
  Manager.socketIo = Manager.socketIo || io;
  const Proc = new Process(content.commands, content.filters, content.config);
  io.on('connection', socket => setupSocketCmds(Proc, socket, content));
};

exports.sockr = sockr;
