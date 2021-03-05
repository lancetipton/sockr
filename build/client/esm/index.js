import React, { useContext, useMemo, useRef, useReducer, useEffect } from 'react';

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

const OPTIONS = {
  SHOULD_LOG: true,
  SHOULD_THROW: false,
  LOG_PREFIX: null
};
const validate = (argObj, validators = {}, {
  logs = OPTIONS.SHOULD_LOG,
  throws = OPTIONS.SHOULD_THROW,
  prefix = OPTIONS.LOG_PREFIX
} = {}) => {
  const validationCaseEntries = Object.entries(argObj);
  const defaultValidator = () => true;
  const validationResults = validationCaseEntries.map(([argName, argValue]) => validateArgument(argName, argValue, validators[argName] || validators['$default'] || defaultValidator));
  const reduceCases = (total, next) => validationReducer(total, next, {
    logs,
    throws,
    prefix
  });
  const {
    success,
    cases
  } = validationResults.reduce(reduceCases, {
    success: true,
    cases: {}
  });
  return [success, cases];
};
validate.setOptions = ({
  logs,
  throws,
  prefix
}) => {
  if (logs !== undefined) {
    OPTIONS.SHOULD_LOG = logs;
  }
  if (throws !== undefined) {
    OPTIONS.SHOULD_THROW = throws;
  }
  if (prefix !== undefined) {
    OPTIONS.LOG_PREFIX = prefix;
  }
};
validate.resetOptions = () => {
  OPTIONS.SHOULD_LOG = true;
  OPTIONS.SHOULD_THROW = false;
  OPTIONS.LOG_PREFIX = null;
};
const validateArgument = (key, value, validator) => {
  const success = validator(value);
  const shouldStringifyValidator = !validator.name || validator.name === key || validator.name === '$default';
  const validatorString = shouldStringifyValidator ? validator.toString() : validator.name;
  const reason = success ? null : [`Argument "${key}" with value `, value, ` failed validator: ${validatorString}.`];
  return {
    success,
    key,
    value,
    validator,
    reason
  };
};
const validationReducer = (finalResult, nextValidation, {
  logs,
  throws,
  prefix
}) => {
  !nextValidation.success && handleFailure(nextValidation, logs, throws, prefix);
  return {
    success: finalResult.success && nextValidation.success,
    cases: { ...finalResult.cases,
      [nextValidation.key]: nextValidation
    }
  };
};
const handleFailure = (validation, shouldLog, shouldThrow, prefix) => {
  const reason = prefix ? [prefix, ...validation.reason] : validation.reason;
  if (shouldThrow) throw new Error(reason.join());
  if (shouldLog) console.error(...reason);
};

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

const typeOf = val => Object.prototype.toString.call(val).slice(8, -1);

const noOp = () => {};
const noOpObj = Object.freeze({});
const noPropObj = deepFreeze({
  content: {}
});
const noPropArr = deepFreeze([]);
const match = (matchArg, ...args) => {
  if (!args.length) return null;
  for (let entry of args) {
    if (!isArr(entry)) {
      console.error(`Matching case must be an entry (a 2-element array). Found: ${typeOf(entry)}`, entry);
      break;
    }
    const [caseValueOrPredicate, valueOnMatch] = entry;
    if (isFunc(caseValueOrPredicate) && caseValueOrPredicate(matchArg)) return valueOnMatch;
    if (caseValueOrPredicate === matchArg) return valueOnMatch;
  }
  return null;
};
match.default = () => true;

const exists = value => value === value && value !== undefined && value !== null;

const equalsNaN = val => typeof val === 'number' && val != val;
const isNum = val => typeof val === 'number' && !equalsNaN(val);

const isNonNegative = val => isNum(val) && val >= 0;

const isStr = str => typeof str === 'string';

const isBool = val => typeof val === 'boolean';

const isOrderable = x => isStr(x) || isNum(x) || isBool(x);
const compareTo = (x, y) => {
  const [valid] = validate({
    x,
    y
  }, {
    $default: isOrderable
  });
  if (!valid) return null;
  return isStr(x) ? x.localeCompare(y) : x - y;
};
const identity = x => x;

const buildElementCountMap = arr => {
  const counts = new Map();
  for (let i = 0; i < arr.length; i++) {
    var _counts$get;
    const element = arr[i];
    const count = (_counts$get = counts.get(element)) !== null && _counts$get !== void 0 ? _counts$get : 0;
    counts.set(element, count + 1);
  }
  return counts;
};
const areCountMapsEqual = (mapA, mapB) => {
  if (mapA.size !== mapB.size) return false;
  for (let [key, count] of mapA) {
    const otherCount = mapB.get(key);
    if (otherCount !== count) return false;
  }
  return true;
};
const areFrequencyEqual = (arr, otherArr) => {
  const [valid] = validate({
    arr,
    otherArr
  }, {
    $default: isArr
  });
  if (!valid) return null;
  if (arr === otherArr) return true;
  if (arr.length !== otherArr.length) return false;
  const arrCounts = buildElementCountMap(arr);
  const otherCounts = buildElementCountMap(otherArr);
  return areCountMapsEqual(arrCounts, otherCounts);
};
const areSetEqual = (arr, otherArr) => {
  const [valid] = validate({
    arr,
    otherArr
  }, {
    $default: isArr
  });
  if (!valid) return null;
  if (arr === otherArr) return true;
  const [longest, shortest] = arr.length > otherArr.length ? [arr, otherArr] : [otherArr, arr];
  const arrSet = new Set(shortest);
  for (let i = 0; i < longest.length; i++) {
    const element = longest[i];
    if (!arrSet.has(element)) return false;
  }
  return true;
};
const cloneArr = arr => Array.from([...(isArr(arr) && arr || isObj(arr) && Object.entries(arr) || [])]);
const eitherArr = (a, b) => isArr(a) ? a : b;
const ensureArr = val => isArr(val) ? val : [val];
const flatten = (arr, result, opts) => {
  for (let i = 0; i < arr.length; i++) {
    const value = arr[i];
    isArr(value) ? flatten(value, result, opts) : opts.exists && !exists(value) || opts.truthy && !value ? result : result.push(value);
  }
  if (!opts.mutate) return result;
  Object.assign(arr, result).splice(result.length);
  return arr;
};
const flatArr = (arr, opts) => flatten(arr, [], isObj(opts) ? opts : noOpObj);
const flatMap = (arr, mapFn) => {
  const [inputIsValid] = validate({
    arr,
    mapFn
  }, {
    arr: isArr,
    mapFn: isFunc
  });
  if (!inputIsValid) return arr;
  return arr.reduce((finalArr, current) => {
    const result = mapFn(current);
    isArr(result) ? result.map(el => finalArr.push(el)) : finalArr.push(result);
    return finalArr;
  }, []);
};
const findExtrema = (arr, comparator) => {
  const [valid] = validate({
    arr,
    comparator
  }, {
    arr: isArr,
    $default: isFunc
  });
  if (!valid) return null;
  return arr.length ? arr.reduce((extremaSoFar, next) => comparator(extremaSoFar, next) > 0 ? extremaSoFar : next) : null;
};
const findMax = (arr = [], propSelector = identity) => findExtrema(arr, (x, y) => compareTo(propSelector(x), propSelector(y)));
const findMin = (arr = [], propSelector = identity) => findExtrema(arr, (x, y) => compareTo(propSelector(y), propSelector(x)));
const omitRange = (arr, startIndex, count) => {
  const [inputIsValid] = validate({
    arr,
    startIndex,
    count
  }, {
    arr: isArr,
    $default: isNonNegative
  });
  if (!inputIsValid) return arr;
  const nextArr = [...arr];
  nextArr.splice(startIndex, count);
  return nextArr;
};
const randomArr = (arr, amount) => {
  if (!isArr(arr)) return arr;
  const useAmount = amount || 1;
  const randoms = [];
  for (let i = 0; i < useAmount; i++) {
    randoms.push(arr[Math.floor(Math.random() * arr.length)]);
  }
  return !amount ? randoms[0] : randoms;
};
const randomizeArr = arr => !isArr(arr) && arr || arr.sort(() => 0.5 - Math.random());
const uniqArrByReference = arr => {
  return !isArr(arr) ? arr : arr.filter((e, i, arr) => arr.indexOf(e) == i);
};
const uniqArr = (arr, selector) => {
  if (!selector) return uniqArrByReference(arr);
  const {
    unique
  } = arr.reduce((data, element) => {
    const id = selector(element);
    !data.set.has(id) && data.unique.push(element);
    data.set.add(id);
    return data;
  }, {
    unique: [],
    set: new Set()
  });
  return unique;
};

const applyToFunc = (item, expression) => {
  if (isArr(expression)) {
    const [func, ...args] = expression;
    return func(item, ...args);
  } else if (isFunc(expression)) {
    return expression(item);
  } else {
    console.error(`Pipeline expected either a function or an array (for function expressions). Found ${typeof expression}`);
    return item;
  }
};
const pipeline = (item, ...functions) => {
  return functions.reduce((result, fn) => applyToFunc(result, fn), item);
};
const hasOwn = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

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

const isEmpty = val => isObj(val) ? Object.keys(val).length === 0 : isArr(val) ? val.length === 0 : isStr(val) ? val.trim().length === 0 : isNum(val) ? val < 1 : false;

const checkCall = (method, ...params) => {
  return isFunc(method) ? method(...params) : undefined;
};
const complement = predicate => {
  const [valid] = validate({
    predicate
  }, {
    predicate: isFunc
  });
  return valid ? (...args) => !predicate(...args) : null;
};
const eitherFunc = (func1, func2) => isFunc(func1) && func1 || func2;
const debounce = (func, wait = 250, immediate = false) => {
  let timeout;
  function wrapFunc(...args) {
    if (!isFunc(func)) return null;
    const context = this;
    const later = () => {
      timeout = null;
      !immediate && func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) return isFunc(func) && func.apply(context, args);
  }
  return wrapFunc;
};
const doIt = (...args) => {
  const params = args.slice();
  const num = params.shift();
  const bindTo = params.shift();
  const cb = params.pop();
  if (!isNum(num) || !isFunc(cb)) return [];
  const doItAmount = new Array(num);
  const responses = [];
  for (let i = 0; i < doItAmount.length; i++) {
    const data = cb.call(bindTo, i, ...params);
    if (data === false) break;
    responses.push(data);
  }
  return responses;
};
const hasDomAccess = () => {
  try {
    return !!(typeof window !== 'undefined' && window.document && window.document.createElement);
  } catch (error) {
    return false;
  }
};
const memorize = (func, getCacheKey, limit = 1) => {
  if (!isFunc(func) || getCacheKey && !isFunc(getCacheKey)) return console.error('Error: Expected a function', func, getCacheKey);
  let memorized = function () {
    const cache = memorized.cache;
    const key = getCacheKey ? getCacheKey.apply(this, arguments) : arguments[0];
    if (hasOwn(cache, key)) return cache[key];
    const result = func.apply(this, arguments);
    isNum(limit) && Object.keys(cache).length < limit ? cache[key] = result : memorized.cache = {
      [key]: result
    };
    return result;
  };
  memorized.cache = {};
  memorized.destroy = () => {
    getCacheKey = undefined;
    memorized.cache = undefined;
    memorized.destroy = undefined;
    memorized = undefined;
  };
  return memorized;
};
const runSeq = async (asyncFns = [], options = {}) => {
  const [valid] = validate({
    asyncFns
  }, {
    asyncFns: isArr
  });
  if (!valid) return [];
  const {
    cloneResults = false,
    returnOriginal = true
  } = options;
  const results = [];
  for (const fn of asyncFns) {
    const result = isFunc(fn) ? await fn(results.length, cloneResults ? deepClone(results) : results) : returnOriginal ? fn : undefined;
    results.push(result);
  }
  return results;
};
const timedRun = async (fn, ...args) => {
  const [valid] = validate({
    fn
  }, {
    fn: isFunc
  });
  if (!valid) return [undefined, -1];
  const startTime = new Date();
  const result = await fn(...args);
  return [result, new Date() - startTime];
};
const throttle = (func, wait = 100) => {
  let waiting = false;
  return function (...args) {
    if (waiting) return;
    waiting = true;
    func.apply(this, args);
    return setTimeout(() => {
      waiting = false;
    }, wait);
  };
};
const throttleLast = (func, cb, wait = 100) => {
  let throttleTimeout;
  return function (...args) {
    if (throttleTimeout) clearTimeout(throttleTimeout);
    throttleTimeout = setTimeout(() => {
      func.apply(this, args);
      clearTimeout(throttleTimeout);
    }, wait);
    typeof cb === 'function' && cb();
  };
};
const limbo = promise => {
  return !promise || !isFunc(promise.then) ? [new Error(`A promise or thenable is required as the first argument!`), null] : promise.then(data => [null, data]).catch(err => [err, undefined]);
};
const uuid = a => a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, uuid);
const parseErrorMessage = exception => {
  return isStr(exception) && !isEmpty(exception) ? exception : isObj(exception) ? exception.message : null;
};

const toStr$1 = val => val === null || val === undefined ? '' : isStr(val) ? val : JSON.stringify(val);

const buildPath = (...args) => {
  const built = args.reduce((path, arg) => {
    let str = toStr(arg);
    return `${path}${str && '/' + str || ''}`;
  }, '');
  return built.replace(/([^:\/]|^)\/{2,}/g, '$1/');
};
const mapString = (str, charMapper) => {
  if (!isStr(str)) return str;
  if (!isFunc(charMapper)) return str;
  let result = "";
  for (const char of str) {
    result += charMapper(char);
  }
  return result;
};
const isLowerCase = str => str === str.toLowerCase();
const isUpperCase = str => str === str.toUpperCase();
const delimitString = (str, delimiter, delimiters = ['-', '_', ' ']) => {
  if (!isStr(str)) return str;
  const isDelimiter = c => delimiters.some(del => del === c);
  let prevChar = '_';
  return mapString(str, char => {
    if (isDelimiter(char)) {
      prevChar = delimiter;
      return delimiter;
    }
    if (isUpperCase(char) && isLowerCase(prevChar) && !isDelimiter(prevChar)) {
      prevChar = char;
      return delimiter + char;
    }
    prevChar = char;
    return char;
  });
};
const snakeCase = str => {
  const underscored = delimitString(str, '_');
  return underscored.toLowerCase();
};
const capitalize = (str, lowercaseTail = true) => {
  if (!isStr(str) || !str[0]) return str;
  const tail = lowercaseTail ? str.slice(1).toLowerCase() : str.slice(1);
  return `${str[0].toUpperCase()}${tail}`;
};
const removeDot = string => {
  const noDot = string.indexOf('.') === 0 ? string.slice(1) : string;
  return noDot.indexOf('.') === noDot.length - 1 ? noDot.slice(0, -1) : noDot;
};
const cleanStr = str => {
  return str && removeDot(str).replace(/[-_]/gm, ' ') || str;
};
const camelCase = (str, compCase) => {
  return str && cleanStr(str).split(/[\s_-]/gm).reduce((cased, word, index) => {
    if (!word) return cased;
    cased += (index > 0 || compCase) && capitalize(word) || word.toLowerCase();
    return cased;
  }, '') || str;
};
const camelCasePath = path => {
  const split = path.split('.');
  const camelCasedSplit = split.map((str, idx) => idx > 0 ? capitalize(str, false) : str);
  return camelCasedSplit.length > 1 ? camelCasedSplit.join('') : path;
};
const containsStr = (str, substring, fromIndex) => {
  str = !isStr(str) && toStr$1(str) || str;
  substring = !isStr(substring) && toStr$1(substring) || substring;
  return str.indexOf(substring, fromIndex) !== -1;
};
const eitherStr = (str1, str2) => isStr(str1) && str1 || str2;
const uppercasePattern = /[A-Z]/g;
const msPattern = /^ms-/;
const hyphenCache = {};
const toHyphenLower = match => '-' + match.toLowerCase();
const hyphenator = rule => {
  if (hyphenCache.hasOwnProperty(rule)) return hyphenCache[rule];
  const hRule = rule.replace(uppercasePattern, toHyphenLower);
  return hyphenCache[rule] = msPattern.test(hRule) ? '-' + hRule : hRule;
};
const hashString = (str, maxLength) => {
  if (!isStr(str) || str.length == 0) return 0;
  str = str.split('').reverse().join('');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = `${Math.abs(hash & hash)}`;
  }
  return isNonNegative(maxLength) ? hash.slice(0, maxLength) : hash;
};
const isEmail = str => {
  if (!str || !isStr(str)) return false;
  const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return Boolean(regex.test(str));
};
const isPhone = str => {
  if (!str || !isStr(str)) return false;
  const regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
  return Boolean(regex.test(str)) && str.replace(/\D/g, '').length < 11;
};
const isUrl = str => {
  const regex = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
  return Boolean(regex.test(str));
};
const isUuid = str => {
  if (!str || !isStr(str)) return false;
  const regex = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
  return Boolean(regex.test(str));
};
const parseJSON = str => {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error(e.message);
    return null;
  }
};
const plural = str => {
  if (!str || !str.length) return str;
  return str[str.length - 1] !== 's' ? str + 's' : str;
};
const singular = str => {
  if (!str || !str.length) return str;
  return str[str.length - 1] === 's' ? str.slice(0, str.length - 1) : str;
};
const styleCase = str => {
  if (!isStr(str)) return str;
  const cased = camelCase(str);
  return `${cased[0].toLowerCase()}${cased.slice(1)}`;
};
const trainCase = str => isStr(str) && str.split(/(?=[A-Z])|[\s_-]/gm).join('-').toLowerCase() || str;
const wordCaps = str => {
  if (!isStr(str)) return str;
  let cleaned = cleanStr(str);
  return cleaned.split(' ').map(word => word && capitalize(word) || '').join(' ');
};
const spaceJoin = (original, toAdd) => {
  toAdd = isArr(toAdd) ? toAdd : [toAdd];
  return toAdd.reduce((joined, item) => {
    return isStr(item) ? `${joined ? joined + ' ' : ''}${item}`.trim() : joined;
  }, isStr(original) ? original : '');
};
const template = (tempStr, data, fallback = '') => {
  data = isColl(data) && data || {};
  const regex = template.regex || /\${(.*?)\}/g;
  return isStr(tempStr) ? tempStr.replace(regex, (match, exact) => {
    const path = (exact || match.substr(2, match.length - 3)).trim();
    const replaceWith = get(data, path, fallback);
    return isFunc(replaceWith) ? replaceWith(data, path, fallback) : replaceWith;
  }) : console.error(`template requires a string as the first argument`) || tempStr;
};
const validFilename = fileName => {
  if (!fileName) return false;
  const regex = /[<>:"/\\|?*\u0000-\u001F]/g;
  const windowsRegex = /^(con|prn|aux|nul|com\d|lpt\d)$/i;
  const periodRegex = /^\.\.?$/;
  return regex.test(fileName) || windowsRegex.test(fileName) || periodRegex.test(fileName) ? false : true;
};
const quoteSymbols = ['\"', '\''];
const isQuoted = (str, quotes = quoteSymbols) => {
  return isStr(str) && quotes.some(quote => str.startsWith(quote) && str.endsWith(quote));
};
const reverseStr = str => {
  if (!isStr(str)) return undefined;
  let reversed = '';
  for (let char of str) {
    reversed = char + reversed;
  }
  return reversed;
};
const getNearestDelimiterIndex = (text, index, delimiters) => {
  const indices = delimiters.map(str => text.indexOf(str, index)).sort();
  return indices.find(idx => idx >= 0);
};
const getWordStartingAt = (text, index, delimiters = [' ']) => {
  const endingSpaceIdx = getNearestDelimiterIndex(text, index, delimiters);
  return text.substring(index, endingSpaceIdx === -1 ? text.length : endingSpaceIdx);
};
const getWordEndingAt = (text, index, delimiters = [' ']) => {
  const reversed = reverseStr(text);
  const reversedIndex = text.length - index;
  return reverseStr(getWordStartingAt(reversed, reversedIndex, delimiters));
};

const sanitize = str => isStr(str) && str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') || str;

const isStrBool = val => val === 'false' || val === 'true';
const convertToStrBool = val => isBool(val) ? toStr$1(val) : !val || val === 'false' || val === '0' ? 'false' : 'true';
const toBool = val => isStrBool(val) ? val === 'true' : convertToStrBool(val) === 'true';

const softFalsy = val => Boolean(val || val === '' || val === 0);

const getNums = val => toStr$1(val).replace(/([^.\d])/gm, '');
const toNum = val => isNum(val) ? val : val && !equalsNaN(val) && Number(getNums(val)) || 0;

const isNegative = x => isNum(x) && x < 0;
const isPositive = x => isNum(x) && x > 0;
const isFloat = val => isNum(val) && val % 1 !== 0;
const isInt = val => isNum(val) && val % 1 === 0;
const nth = num => {
  if (!isNum(num)) {
    num = getNums(num);
    if (!num) return '';
    num = toNum(num);
    if (equalsNaN(num)) return '';
  }
  const mod = num % 100;
  if (mod >= 10 && mod <= 20) return 'th';
  switch (num % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
};
const toFloat = val => val && !equalsNaN(val) && parseFloat(isNum(val) && val || getNums(val)) || 0;
const toInt = val => val && !equalsNaN(val) && parseInt(isNum(val) && val || getNums(val)) || 0;

const cleanColl = (coll, recursive = true) => {
  return isColl(coll) ? Object.keys(coll).reduce((cleaned, key) => {
    const value = coll[key];
    if (value === null || value === undefined) return cleaned;
    cleaned[key] = recursive && isColl(value) ? cleanColl(value) : value;
    return cleaned;
  }, isObj(coll) && {} || []) : console.error(`cleanColl requires a collection as the first argument`) || coll;
};
const isEmptyColl = obj => isArr(obj) ? obj.length === 0 : isColl(obj) && Object.getOwnPropertyNames(obj).length === 0;
const mapColl = (coll, cb) => isFunc(cb) && isColl(coll) ? Object.keys(coll).map(key => cb(key, coll[key], coll)) : isArr(coll) ? [] : {};
const reduceColl = (coll, cb, reduce) => isFunc(cb) && isColl(coll) ? Object.keys(coll).reduce((data, key) => cb(key, coll[key], coll, data), reduce) : isArr(coll) ? [] : {};
const unset = (obj, path) => updateColl(obj, path, 'unset');
const isArray = Array.isArray;
const keyList = Object.keys;
const hasProp = Object.prototype.hasOwnProperty;
const deepEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b || typeof a != 'object' || typeof b != 'object') return a !== a && b !== b;
  const arrA = isArray(a);
  const arrB = isArray(b);
  let i;
  let length;
  let key;
  if (arrA && arrB) {
    length = a.length;
    if (length != b.length) return false;
    for (i = length; i-- !== 0;) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  if (arrA != arrB) return false;
  const dateA = a instanceof Date;
  const dateB = b instanceof Date;
  if (dateA != dateB) return false;
  if (dateA && dateB) return a.getTime() == b.getTime();
  const regexpA = a instanceof RegExp;
  const regexpB = b instanceof RegExp;
  if (regexpA != regexpB) return false;
  if (regexpA && regexpB) return a.toString() == b.toString();
  const keys = keyList(a);
  length = keys.length;
  if (length !== keyList(b).length) return false;
  for (i = length; i-- !== 0;) if (!hasProp.call(b, keys[i])) return false;
  for (i = length; i-- !== 0;) {
    key = keys[i];
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
};
const repeat = (element, times, cloneDeep = false) => {
  if (!times || times <= 0) return [];
  if (!isNum(times)) {
    console.error("Times argument must be a number");
    return [];
  }
  const arr = [];
  for (let i = 0; i < times; i++) {
    const value = isFunc(element) ? element() : cloneDeep ? deepClone(element) : element;
    arr.push(value);
  }
  return arr;
};
const shallowEqual = (col1, col2, path) => {
  if (path && (isArr(path) || isStr(path))) {
    col1 = get(col1, path);
    col2 = get(col2, path);
  }
  if (col1 === col2) return true;
  if (!col1 || !isColl(col1) || !col2 || !isColl(col2)) return false;
  if (Object.keys(col1).length !== Object.keys(col2).length) return false;
  for (const key in col1) if (col1[key] !== col2[key]) return false;
  return true;
};

const set = (obj, path, val) => updateColl(obj, path, 'set', val);

const either = (val1, val2, check) => !isFunc(check) ? softFalsy(val1) && val1 || val2 : check(val1, val2) && val1 || val2;
const isSame = (val1, val2) => val1 === val2 ? val1 !== 0 || 1 / val1 === 1 / val2 : val1 !== val1 && val2 !== val2;
const isValidDate = date => !isNaN((date instanceof Date && date || new Date(date)).getTime());

const strToType = val => {
  return !val || !isStr(val) ? val : isStrBool(val) ? toBool(val) : isNum(val) ? toNum(val) : (() => {
    try {
      return JSON.parse(val);
    } catch (e) {
      return val;
    }
  })();
};

let SHOW_LOGS;
let METH_DEF = 'dir';
let PREFIX = 'type';
const LOG_TYPES = ['error', 'info', 'log', 'dir', 'warn'];
const setLogs = (log, methDef, prefix) => {
  SHOW_LOGS = log;
  METH_DEF = methDef || METH_DEF || 'log';
  PREFIX = prefix || PREFIX || 'type';
};
const resetLogs = () => {
  SHOW_LOGS = undefined;
  METH_DEF = 'log';
  PREFIX = 'type';
};
const logData = (...args) => {
  if (!args.length) return;
  let type = args.length === 1 ? METH_DEF : args.pop();
  if (!SHOW_LOGS && type !== 'error') return;else if (typeof args[0] === 'string') {
    if (PREFIX === 'type') args[0] = `[ ${type.toUpperCase()} ] ${args[0]}`;else if (PREFIX) args[0] = `${PREFIX} ${args[0]}`;
  }
  LOG_TYPES.indexOf(type) !== -1 ? console[type](...args) : console[METH_DEF](...args, type);
};

const reduceObj = (obj, cb, start = {}) => isObj(obj) && isFunc(cb) && Object.entries(obj).reduce((data, [key, value]) => cb(key, value, data), start) || start;

const cloneJson = obj => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    logData(e.message, 'error');
    return null;
  }
};
const clearObj = (obj, filter) => {
  obj && Object.entries(obj).map(([key, value]) => {
    if (filter && filter.indexOf(key) !== -1) return;
    if (typeof value === 'object') clearObj(value);
    obj[key] = undefined;
    delete obj[key];
  });
};
const eitherObj = (obj1, obj2) => isObj(obj1) && obj1 || obj2;
const deepMerge = (...sources) => {
  return sources.reduce((merged, source) => {
    const srcCopy = deepClone(source);
    return isArr(srcCopy) ? [...(isArr(merged) && merged || []), ...srcCopy] : isObj(srcCopy) ? Object.entries(srcCopy).reduce((joined, [key, value]) => ({ ...joined,
      [key]: isFunc(value) ? cloneFunc(value) : isColl(value) && key in joined ? deepMerge(joined[key], value) : deepClone(value)
    }), merged) : merged;
  }, isArr(sources[0]) && [] || {});
};
const applyToCloneOf = (obj, mutatorCb) => {
  let error;
  if (!obj) error = 'object (Argument 1) in applyToCloneOf, must be defined!';
  if (!isObj(obj)) error = 'object (Argument 1) in applyToCloneOf, must be an object!';
  if (!mutatorCb) error = 'mutator (Argument 2) in applyToCloneOf, must be defined!';
  if (!isFunc(mutatorCb)) error = 'mutator (Argument 2) arg in applyToCloneOf, must be a function!';
  if (error) return console.warn(error) || obj;
  const clone = deepClone(obj);
  mutatorCb(clone);
  return clone;
};
const jsonEqual = (one, two) => {
  try {
    return JSON.stringify(one) === JSON.stringify(two);
  } catch (e) {
    return false;
  }
};
const isEntry = maybeEntry => isArr(maybeEntry) && maybeEntry.length === 2 && (isNum(maybeEntry[0]) || isStr(maybeEntry[0]));
const mapEntries = (obj, cb) => {
  if (!isArr(obj) && !isObj(obj)) {
    console.error(obj, `Expected array or object for obj. Found ${typeof obj}`);
    return obj;
  }
  if (!isFunc(cb)) {
    console.error(`Expected function for cb. Found ${typeof cb}`);
    return obj;
  }
  const entries = Object.entries(obj);
  const initialValue = isArr(obj) ? [] : {};
  return entries.reduce((obj, [key, value]) => {
    const result = cb(key, value);
    if (!isEntry(result)) {
      console.error(`Callback function must return entry. Found: ${result}. Using current entry instead.`);
      return set(obj, key, value);
    }
    return set(obj, result[0], result[1]);
  }, initialValue);
};
const mapKeys = (obj, keyMapper) => {
  if (!isObj(obj) || !isFunc(keyMapper)) return obj;
  return mapEntries(obj, (key, value) => [keyMapper(key), value]);
};
const mapObj = (obj, cb) => isObj(obj) && isFunc(cb) && Object.entries(obj).map(([key, value]) => cb(key, value)) || obj;
const isArrMap = obj => {
  if (!isObj(obj)) return false;
  const values = Object.values(obj);
  return toBool(values.length && values.every(isArr));
};
const omitKeys = (obj = {}, keys = []) => isObj(obj) && reduceObj(obj, (key, _, updated) => {
  keys.indexOf(key) === -1 && (updated[key] = obj[key]);
  return updated;
}, {}) || {};
const pickKeys = (obj = {}, keys = []) => isObj(obj) && keys.reduce((updated, key) => {
  key in obj && (updated[key] = obj[key]);
  return updated;
}, {}) || {};
const sanitizeCopy = obj => JSON.parse(sanitize(JSON.stringify(obj)));
const trimStringFields = object => Object.entries(object).reduce((cleaned, [key, value]) => {
  cleaned[key] = isStr(value) ? value.trim() : value;
  return cleaned;
}, object);
const toObj = (val, divider, split) => {
  if (isArr(val)) return Object.keys(val).reduce((obj, key) => {
    obj[key] = val[key];
    return obj;
  }, {});
  if (!isStr(str)) return {};
  divider = divider || '=';
  split = split || '&';
  return str.split(split).reduce((obj, item) => {
    const sep = item.split(divider);
    obj[sep[0].trim()] = strToType(sep[1].trim());
    return obj;
  }, {});
};
const keyMap = (arr, toUpperCase) => isArr(arr) && arr.reduce((obj, key) => {
  if (!isStr(key)) return obj;
  const use = toUpperCase && key.toUpperCase() || key;
  obj[use] = use;
  return obj;
}, {}) || {};
const everyEntry = (obj, predicate) => {
  if (!obj) {
    console.error(`everyEntry expects argument obj [${obj}] to be defined.`);
    return false;
  }
  if (!isObj(obj)) {
    console.error(`Argument obj ${obj} must be an object.`);
    return false;
  }
  if (!isFunc(predicate)) {
    console.error(`Argument 'predicate' passed into everyEntry must a function. Found: ${predicate}`);
    return false;
  }
  return pipeline(obj, Object.entries, entries => entries.every(([key, value]) => predicate(key, value)));
};
const someEntry = (obj, predicate) => {
  if (!obj) {
    console.error(`someEntry expects argument obj [${obj}] to be defined.`);
    return false;
  }
  if (!isObj(obj)) {
    console.error(`Argument obj ${obj} must be an object.`);
    return false;
  }
  if (!isFunc(predicate)) {
    console.error(`Argument 'predicate' passed into someEntry must a function. Found: ${predicate}`);
    return false;
  }
  return pipeline(obj, Object.entries, entries => entries.some(([key, value]) => predicate(key, value)));
};
const filterObj = (obj, predicate) => {
  if (!obj) return obj;
  if (!isObj(obj)) {
    console.error(`Object ${obj} was not an object. It must be for filterObject`);
    return obj;
  }
  if (!isFunc(predicate)) {
    console.error(`Argument 'predicate' passed into filterObject must a function. Found: ${predicate}`);
    return obj;
  }
  return reduceObj(obj, (key, value, data) => {
    if (predicate(key, value)) data[key] = value;
    return data;
  }, {});
};

const promisify = method => {
  if (!isFunc(method)) throw `Argument must be a function`;
  return (...args) => {
    return new Promise((res, rej) => {
      if (!isFunc(args[args.length - 1])) return res(method(...args));
      args.pop();
      args.push((...cbData) => {
        return cbData && cbData[0] ? rej(...cbData) : res(...cbData);
      });
      return method(...args);
    });
  };
};
const defObjProps = Array.from(['caller', 'callee', 'arguments', 'apply', 'bind', 'call', 'toString', '__proto__', '__defineGetter__', '__defineSetter__', 'hasOwnProperty', '__lookupGetter__', '__lookupSetter__', 'isPrototypeOf', 'propertyIsEnumerable', 'valueOf', 'toLocaleString']).concat(Object.getOwnPropertyNames(Object.prototype)).reduce((map, functionName) => {
  map[functionName] = true;
  return map;
}, {});
const addAsync = object => {
  if (!object.__IS_PROMISIFIED__) {
    for (const prop of Object.getOwnPropertyNames(object)) {
      const isAsync = prop.indexOf('Async') !== -1 || object[`${prop}Async`];
      if (isAsync || defObjProps[prop]) continue;
      if (isFunc(object[prop])) object[`${prop}Async`] = promisify(object[prop]);else {
        const getValue = Object.getOwnPropertyDescriptor(object, prop).get;
        if (isFunc(getValue)) object[`${prop}Async`] = promisify(getValue);
      }
    }
    object.__IS_PROMISIFIED__ = true;
  }
  return object;
};
const promisifyAll = object => {
  if (!isObj(object)) return object;
  addAsync(object);
  const proto = Object.getPrototypeOf(object);
  proto && Object.getPrototypeOf(proto) !== null && addAsync(proto);
  return object;
};
const wait = time => new Promise(res => setTimeout(() => res(true), time));

const isRegex = val => Boolean(val && val instanceof RegExp);
const getRegexSource = maybeRx => isRegex(maybeRx) ? maybeRx.source : isStr(maybeRx) ? maybeRx : null;
const parseArgs = args => {
  if (isArr(args[0])) return [args[0], args[1]];
  const last = args[args.length - 1];
  const options = isStr(last) ? last : undefined;
  const expressions = options ? args.splice(0, args.length - 1) : args;
  return [expressions, options];
};
const joinRegex = (...args) => {
  const [expressions, options] = parseArgs(args);
  const source = expressions.reduce((joined, next) => {
    const nextSource = getRegexSource(next);
    return !nextSource ? joined : joined === '' ? nextSource : `${joined}|${nextSource}`;
  }, '');
  return new RegExp(`(${source})`, options);
};

const queryToObj = string => {
  const currentQueryItems = {};
  const stringSplit = string.split('?');
  const querystring = stringSplit[stringSplit.length - 1];
  if (!querystring) return currentQueryItems;
  const split = querystring.split('&');
  split.length && split.map(item => {
    const components = item.split('=');
    if (components.length <= 1) return currentQueryItems;
    const itemSplit = [components.shift(), components.join('=')];
    if (itemSplit.length === 2) {
      const array = decodeURIComponent(itemSplit[1]).split(',');
      if (array && array.length > 1) currentQueryItems[itemSplit[0]] = array;else if (itemSplit[0] in currentQueryItems) {
        const val = currentQueryItems[itemSplit[0]];
        currentQueryItems[itemSplit[0]] = isArr(val) ? val.push(decodeURIComponent(itemSplit[1])) : [val, decodeURIComponent(itemSplit[1])];
      } else currentQueryItems[itemSplit[0]] = decodeURIComponent(itemSplit[1]);
    }
  });
  return currentQueryItems;
};
const objToQuery = obj => {
  let firstSet;
  return reduceObj(obj, (key, value, urlStr) => {
    if (!value) return urlStr;
    const useVal = isStr(value) || isNum(value) || isBool(value) ? value : isColl(value) ? isArr(value) ? value.join(',') : JSON.stringify(value) : null;
    if (!useVal) return urlStr;
    urlStr = !firstSet ? `?${encodeURIComponent(key)}=${encodeURIComponent(useVal)}` : `${urlStr}&${encodeURIComponent(key)}=${encodeURIComponent(useVal)}`;
    firstSet = true;
    return urlStr;
  }, '');
};
const isValidUrl = string => {
  var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/;
  return regexp.test(string);
};
const getURLParam = paramKey => {
  var _doc$location, _queryToObj$paramKey, _queryToObj;
  const [valid] = validate({
    paramKey
  }, {
    paramKey: isStr
  });
  if (!valid) return null;
  const doc = typeof document !== 'undefined' ? document : null;
  const search = doc === null || doc === void 0 ? void 0 : (_doc$location = doc.location) === null || _doc$location === void 0 ? void 0 : _doc$location.search;
  return isStr(search) ? (_queryToObj$paramKey = (_queryToObj = queryToObj(search)) === null || _queryToObj === void 0 ? void 0 : _queryToObj[paramKey]) !== null && _queryToObj$paramKey !== void 0 ? _queryToObj$paramKey : null : null;
};

var esm = /*#__PURE__*/Object.freeze({
  __proto__: null,
  validate: validate,
  isArr: isArr,
  areCountMapsEqual: areCountMapsEqual,
  areFrequencyEqual: areFrequencyEqual,
  areSetEqual: areSetEqual,
  buildElementCountMap: buildElementCountMap,
  cloneArr: cloneArr,
  eitherArr: eitherArr,
  ensureArr: ensureArr,
  findExtrema: findExtrema,
  findMax: findMax,
  findMin: findMin,
  flatArr: flatArr,
  flatMap: flatMap,
  omitRange: omitRange,
  randomArr: randomArr,
  randomizeArr: randomizeArr,
  uniqArr: uniqArr,
  uniqArrByReference: uniqArrByReference,
  isObj: isObj,
  isFunc: isFunc,
  deepFreeze: deepFreeze,
  match: match,
  noOp: noOp,
  noOpObj: noOpObj,
  noPropArr: noPropArr,
  noPropObj: noPropObj,
  exists: exists,
  applyToFunc: applyToFunc,
  hasOwn: hasOwn,
  pipeline: pipeline,
  checkCall: checkCall,
  complement: complement,
  debounce: debounce,
  doIt: doIt,
  eitherFunc: eitherFunc,
  hasDomAccess: hasDomAccess,
  limbo: limbo,
  memorize: memorize,
  parseErrorMessage: parseErrorMessage,
  runSeq: runSeq,
  throttle: throttle,
  throttleLast: throttleLast,
  timedRun: timedRun,
  uuid: uuid,
  buildPath: buildPath,
  camelCase: camelCase,
  camelCasePath: camelCasePath,
  capitalize: capitalize,
  cleanStr: cleanStr,
  containsStr: containsStr,
  delimitString: delimitString,
  eitherStr: eitherStr,
  getNearestDelimiterIndex: getNearestDelimiterIndex,
  getWordEndingAt: getWordEndingAt,
  getWordStartingAt: getWordStartingAt,
  hashString: hashString,
  hyphenator: hyphenator,
  isEmail: isEmail,
  isLowerCase: isLowerCase,
  isPhone: isPhone,
  isQuoted: isQuoted,
  isUpperCase: isUpperCase,
  isUrl: isUrl,
  isUuid: isUuid,
  mapString: mapString,
  parseJSON: parseJSON,
  plural: plural,
  removeDot: removeDot,
  reverseStr: reverseStr,
  singular: singular,
  snakeCase: snakeCase,
  spaceJoin: spaceJoin,
  styleCase: styleCase,
  template: template,
  trainCase: trainCase,
  validFilename: validFilename,
  wordCaps: wordCaps,
  isStr: isStr,
  toStr: toStr$1,
  equalsNaN: equalsNaN,
  isNum: isNum,
  isNonNegative: isNonNegative,
  sanitize: sanitize,
  isColl: isColl,
  get: get,
  isBool: isBool,
  convertToStrBool: convertToStrBool,
  isStrBool: isStrBool,
  toBool: toBool,
  softFalsy: softFalsy,
  isFloat: isFloat,
  isInt: isInt,
  isNegative: isNegative,
  isPositive: isPositive,
  nth: nth,
  toFloat: toFloat,
  toInt: toInt,
  getNums: getNums,
  toNum: toNum,
  compareTo: compareTo,
  identity: identity,
  isOrderable: isOrderable,
  cloneFunc: cloneFunc,
  cloneObjWithPrototypeAndProperties: cloneObjWithPrototypeAndProperties,
  deepClone: deepClone,
  typeOf: typeOf,
  isEmpty: isEmpty,
  cleanColl: cleanColl,
  deepEqual: deepEqual,
  isEmptyColl: isEmptyColl,
  mapColl: mapColl,
  reduceColl: reduceColl,
  repeat: repeat,
  shallowEqual: shallowEqual,
  unset: unset,
  set: set,
  either: either,
  isSame: isSame,
  isValidDate: isValidDate,
  strToType: strToType,
  logData: logData,
  resetLogs: resetLogs,
  setLogs: setLogs,
  applyToCloneOf: applyToCloneOf,
  clearObj: clearObj,
  cloneJson: cloneJson,
  deepMerge: deepMerge,
  eitherObj: eitherObj,
  everyEntry: everyEntry,
  filterObj: filterObj,
  isArrMap: isArrMap,
  isEntry: isEntry,
  jsonEqual: jsonEqual,
  keyMap: keyMap,
  mapEntries: mapEntries,
  mapKeys: mapKeys,
  mapObj: mapObj,
  omitKeys: omitKeys,
  pickKeys: pickKeys,
  sanitizeCopy: sanitizeCopy,
  someEntry: someEntry,
  toObj: toObj,
  trimStringFields: trimStringFields,
  reduceObj: reduceObj,
  promisify: promisify,
  promisifyAll: promisifyAll,
  wait: wait,
  getRegexSource: getRegexSource,
  isRegex: isRegex,
  joinRegex: joinRegex,
  getURLParam: getURLParam,
  isValidUrl: isValidUrl,
  objToQuery: objToQuery,
  queryToObj: queryToObj
});

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

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
var parts = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'];
var parseuri = function parseuri(str) {
  var src = str,
      b = str.indexOf('['),
      e = str.indexOf(']');
  if (b != -1 && e != -1) {
    str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
  }
  var m = re.exec(str || ''),
      uri = {},
      i = 14;
  while (i--) {
    uri[parts[i]] = m[i] || '';
  }
  if (b != -1 && e != -1) {
    uri.source = src;
    uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
    uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
    uri.ipv6uri = true;
  }
  uri.pathNames = pathNames(uri, uri['path']);
  uri.queryKey = queryKey(uri, uri['query']);
  return uri;
};
function pathNames(obj, path) {
  var regx = /\/{2,9}/g,
      names = path.replace(regx, "/").split("/");
  if (path.substr(0, 1) == '/' || path.length === 0) {
    names.splice(0, 1);
  }
  if (path.substr(path.length - 1, 1) == '/') {
    names.splice(names.length - 1, 1);
  }
  return names;
}
function queryKey(uri, query) {
  var data = {};
  query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
    if ($1) {
      data[$1] = $2;
    }
  });
  return data;
}

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;
var ms = function (val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val));
};
function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}
function fmtShort(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}
function fmtLong(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural$1(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural$1(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural$1(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural$1(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}
function plural$1(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}

function setup(env) {
  createDebug.debug = createDebug;
  createDebug.default = createDebug;
  createDebug.coerce = coerce;
  createDebug.disable = disable;
  createDebug.enable = enable;
  createDebug.enabled = enabled;
  createDebug.humanize = ms;
  createDebug.destroy = destroy;
  Object.keys(env).forEach(key => {
    createDebug[key] = env[key];
  });
  createDebug.names = [];
  createDebug.skips = [];
  createDebug.formatters = {};
  function selectColor(namespace) {
    let hash = 0;
    for (let i = 0; i < namespace.length; i++) {
      hash = (hash << 5) - hash + namespace.charCodeAt(i);
      hash |= 0;
    }
    return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
  }
  createDebug.selectColor = selectColor;
  function createDebug(namespace) {
    let prevTime;
    let enableOverride = null;
    function debug(...args) {
      if (!debug.enabled) {
        return;
      }
      const self = debug;
      const curr = Number(new Date());
      const ms = curr - (prevTime || curr);
      self.diff = ms;
      self.prev = prevTime;
      self.curr = curr;
      prevTime = curr;
      args[0] = createDebug.coerce(args[0]);
      if (typeof args[0] !== 'string') {
        args.unshift('%O');
      }
      let index = 0;
      args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
        if (match === '%%') {
          return '%';
        }
        index++;
        const formatter = createDebug.formatters[format];
        if (typeof formatter === 'function') {
          const val = args[index];
          match = formatter.call(self, val);
          args.splice(index, 1);
          index--;
        }
        return match;
      });
      createDebug.formatArgs.call(self, args);
      const logFn = self.log || createDebug.log;
      logFn.apply(self, args);
    }
    debug.namespace = namespace;
    debug.useColors = createDebug.useColors();
    debug.color = createDebug.selectColor(namespace);
    debug.extend = extend;
    debug.destroy = createDebug.destroy;
    Object.defineProperty(debug, 'enabled', {
      enumerable: true,
      configurable: false,
      get: () => enableOverride === null ? createDebug.enabled(namespace) : enableOverride,
      set: v => {
        enableOverride = v;
      }
    });
    if (typeof createDebug.init === 'function') {
      createDebug.init(debug);
    }
    return debug;
  }
  function extend(namespace, delimiter) {
    const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
    newDebug.log = this.log;
    return newDebug;
  }
  function enable(namespaces) {
    createDebug.save(namespaces);
    createDebug.names = [];
    createDebug.skips = [];
    let i;
    const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
    const len = split.length;
    for (i = 0; i < len; i++) {
      if (!split[i]) {
        continue;
      }
      namespaces = split[i].replace(/\*/g, '.*?');
      if (namespaces[0] === '-') {
        createDebug.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
      } else {
        createDebug.names.push(new RegExp('^' + namespaces + '$'));
      }
    }
  }
  function disable() {
    const namespaces = [...createDebug.names.map(toNamespace), ...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)].join(',');
    createDebug.enable('');
    return namespaces;
  }
  function enabled(name) {
    if (name[name.length - 1] === '*') {
      return true;
    }
    let i;
    let len;
    for (i = 0, len = createDebug.skips.length; i < len; i++) {
      if (createDebug.skips[i].test(name)) {
        return false;
      }
    }
    for (i = 0, len = createDebug.names.length; i < len; i++) {
      if (createDebug.names[i].test(name)) {
        return true;
      }
    }
    return false;
  }
  function toNamespace(regexp) {
    return regexp.toString().substring(2, regexp.toString().length - 2).replace(/\.\*\?$/, '*');
  }
  function coerce(val) {
    if (val instanceof Error) {
      return val.stack || val.message;
    }
    return val;
  }
  function destroy() {
    console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
  }
  createDebug.enable(createDebug.load());
  return createDebug;
}
var common = setup;

var browser = createCommonjsModule(function (module, exports) {
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = localstorage();
exports.destroy = (() => {
  let warned = false;
  return () => {
    if (!warned) {
      warned = true;
      console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    }
  };
})();
exports.colors = ['#0000CC', '#0000FF', '#0033CC', '#0033FF', '#0066CC', '#0066FF', '#0099CC', '#0099FF', '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF', '#3300CC', '#3300FF', '#3333CC', '#3333FF', '#3366CC', '#3366FF', '#3399CC', '#3399FF', '#33CC00', '#33CC33', '#33CC66', '#33CC99', '#33CCCC', '#33CCFF', '#6600CC', '#6600FF', '#6633CC', '#6633FF', '#66CC00', '#66CC33', '#9900CC', '#9900FF', '#9933CC', '#9933FF', '#99CC00', '#99CC33', '#CC0000', '#CC0033', '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333', '#CC3366', '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633', '#CC9900', '#CC9933', '#CCCC00', '#CCCC33', '#FF0000', '#FF0033', '#FF0066', '#FF0099', '#FF00CC', '#FF00FF', '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF', '#FF6600', '#FF6633', '#FF9900', '#FF9933', '#FFCC00', '#FFCC33'];
function useColors() {
  if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
    return true;
  }
  if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
    return false;
  }
  return typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance ||
  typeof window !== 'undefined' && window.console && (window.console.firebug || window.console.exception && window.console.table) ||
  typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 ||
  typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
}
function formatArgs(args) {
  args[0] = (this.useColors ? '%c' : '') + this.namespace + (this.useColors ? ' %c' : ' ') + args[0] + (this.useColors ? '%c ' : ' ') + '+' + module.exports.humanize(this.diff);
  if (!this.useColors) {
    return;
  }
  const c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit');
  let index = 0;
  let lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, match => {
    if (match === '%%') {
      return;
    }
    index++;
    if (match === '%c') {
      lastC = index;
    }
  });
  args.splice(lastC, 0, c);
}
exports.log = console.debug || console.log || (() => {});
function save(namespaces) {
  try {
    if (namespaces) {
      exports.storage.setItem('debug', namespaces);
    } else {
      exports.storage.removeItem('debug');
    }
  } catch (error) {
  }
}
function load() {
  let r;
  try {
    r = exports.storage.getItem('debug');
  } catch (error) {
  }
  if (!r && typeof process !== 'undefined' && 'env' in process) {
    r = process.env.DEBUG;
  }
  return r;
}
function localstorage() {
  try {
    return localStorage;
  } catch (error) {
  }
}
module.exports = common(exports);
const {
  formatters
} = module.exports;
formatters.j = function (v) {
  try {
    return JSON.stringify(v);
  } catch (error) {
    return '[UnexpectedJSONParseError]: ' + error.message;
  }
};
});
browser.formatArgs;
browser.save;
browser.load;
browser.useColors;
browser.storage;
browser.destroy;
browser.colors;
browser.log;

var url_1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.url = void 0;
const debug = browser("socket.io-client:url");
function url(uri, path = "", loc) {
  let obj = uri;
  loc = loc || typeof location !== "undefined" && location;
  if (null == uri) uri = loc.protocol + "//" + loc.host;
  if (typeof uri === "string") {
    if ("/" === uri.charAt(0)) {
      if ("/" === uri.charAt(1)) {
        uri = loc.protocol + uri;
      } else {
        uri = loc.host + uri;
      }
    }
    if (!/^(https?|wss?):\/\//.test(uri)) {
      debug("protocol-less url %s", uri);
      if ("undefined" !== typeof loc) {
        uri = loc.protocol + "//" + uri;
      } else {
        uri = "https://" + uri;
      }
    }
    debug("parse %s", uri);
    obj = parseuri(uri);
  }
  if (!obj.port) {
    if (/^(http|ws)$/.test(obj.protocol)) {
      obj.port = "80";
    } else if (/^(http|ws)s$/.test(obj.protocol)) {
      obj.port = "443";
    }
  }
  obj.path = obj.path || "/";
  const ipv6 = obj.host.indexOf(":") !== -1;
  const host = ipv6 ? "[" + obj.host + "]" : obj.host;
  obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
  obj.href = obj.protocol + "://" + host + (loc && loc.port === obj.port ? "" : ":" + obj.port);
  return obj;
}
exports.url = url;
});
unwrapExports(url_1);
url_1.url;

var hasCors = createCommonjsModule(function (module) {
try {
  module.exports = typeof XMLHttpRequest !== 'undefined' && 'withCredentials' in new XMLHttpRequest();
} catch (err) {
  module.exports = false;
}
});

var globalThis_browser = (() => {
  if (typeof self !== "undefined") {
    return self;
  } else if (typeof window !== "undefined") {
    return window;
  } else {
    return Function("return this")();
  }
})();

var xmlhttprequest = function (opts) {
  const xdomain = opts.xdomain;
  const xscheme = opts.xscheme;
  const enablesXDR = opts.enablesXDR;
  try {
    if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCors)) {
      return new XMLHttpRequest();
    }
  } catch (e) {}
  try {
    if ("undefined" !== typeof XDomainRequest && !xscheme && enablesXDR) {
      return new XDomainRequest();
    }
  } catch (e) {}
  if (!xdomain) {
    try {
      return new globalThis_browser[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
    } catch (e) {}
  }
};

const PACKET_TYPES = Object.create(null);
PACKET_TYPES["open"] = "0";
PACKET_TYPES["close"] = "1";
PACKET_TYPES["ping"] = "2";
PACKET_TYPES["pong"] = "3";
PACKET_TYPES["message"] = "4";
PACKET_TYPES["upgrade"] = "5";
PACKET_TYPES["noop"] = "6";
const PACKET_TYPES_REVERSE = Object.create(null);
Object.keys(PACKET_TYPES).forEach(key => {
  PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
});
const ERROR_PACKET = {
  type: "error",
  data: "parser error"
};
var commons = {
  PACKET_TYPES,
  PACKET_TYPES_REVERSE,
  ERROR_PACKET
};

const {
  PACKET_TYPES: PACKET_TYPES$1
} = commons;
const withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]";
const withNativeArrayBuffer = typeof ArrayBuffer === "function";
const isView = obj => {
  return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj && obj.buffer instanceof ArrayBuffer;
};
const encodePacket = ({
  type,
  data
}, supportsBinary, callback) => {
  if (withNativeBlob && data instanceof Blob) {
    if (supportsBinary) {
      return callback(data);
    } else {
      return encodeBlobAsBase64(data, callback);
    }
  } else if (withNativeArrayBuffer && (data instanceof ArrayBuffer || isView(data))) {
    if (supportsBinary) {
      return callback(data instanceof ArrayBuffer ? data : data.buffer);
    } else {
      return encodeBlobAsBase64(new Blob([data]), callback);
    }
  }
  return callback(PACKET_TYPES$1[type] + (data || ""));
};
const encodeBlobAsBase64 = (data, callback) => {
  const fileReader = new FileReader();
  fileReader.onload = function () {
    const content = fileReader.result.split(",")[1];
    callback("b" + content);
  };
  return fileReader.readAsDataURL(data);
};
var encodePacket_browser = encodePacket;

var base64Arraybuffer = createCommonjsModule(function (module, exports) {
(function (chars) {
  exports.encode = function (arraybuffer) {
    var bytes = new Uint8Array(arraybuffer),
        i,
        len = bytes.length,
        base64 = "";
    for (i = 0; i < len; i += 3) {
      base64 += chars[bytes[i] >> 2];
      base64 += chars[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
      base64 += chars[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
      base64 += chars[bytes[i + 2] & 63];
    }
    if (len % 3 === 2) {
      base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
      base64 = base64.substring(0, base64.length - 2) + "==";
    }
    return base64;
  };
  exports.decode = function (base64) {
    var bufferLength = base64.length * 0.75,
        len = base64.length,
        i,
        p = 0,
        encoded1,
        encoded2,
        encoded3,
        encoded4;
    if (base64[base64.length - 1] === "=") {
      bufferLength--;
      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }
    var arraybuffer = new ArrayBuffer(bufferLength),
        bytes = new Uint8Array(arraybuffer);
    for (i = 0; i < len; i += 4) {
      encoded1 = chars.indexOf(base64[i]);
      encoded2 = chars.indexOf(base64[i + 1]);
      encoded3 = chars.indexOf(base64[i + 2]);
      encoded4 = chars.indexOf(base64[i + 3]);
      bytes[p++] = encoded1 << 2 | encoded2 >> 4;
      bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
      bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
    }
    return arraybuffer;
  };
})("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
});
base64Arraybuffer.encode;
base64Arraybuffer.decode;

const {
  PACKET_TYPES_REVERSE: PACKET_TYPES_REVERSE$1,
  ERROR_PACKET: ERROR_PACKET$1
} = commons;
const withNativeArrayBuffer$1 = typeof ArrayBuffer === "function";
let base64decoder;
if (withNativeArrayBuffer$1) {
  base64decoder = base64Arraybuffer;
}
const decodePacket = (encodedPacket, binaryType) => {
  if (typeof encodedPacket !== "string") {
    return {
      type: "message",
      data: mapBinary(encodedPacket, binaryType)
    };
  }
  const type = encodedPacket.charAt(0);
  if (type === "b") {
    return {
      type: "message",
      data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
    };
  }
  const packetType = PACKET_TYPES_REVERSE$1[type];
  if (!packetType) {
    return ERROR_PACKET$1;
  }
  return encodedPacket.length > 1 ? {
    type: PACKET_TYPES_REVERSE$1[type],
    data: encodedPacket.substring(1)
  } : {
    type: PACKET_TYPES_REVERSE$1[type]
  };
};
const decodeBase64Packet = (data, binaryType) => {
  if (base64decoder) {
    const decoded = base64decoder.decode(data);
    return mapBinary(decoded, binaryType);
  } else {
    return {
      base64: true,
      data
    };
  }
};
const mapBinary = (data, binaryType) => {
  switch (binaryType) {
    case "blob":
      return data instanceof ArrayBuffer ? new Blob([data]) : data;
    case "arraybuffer":
    default:
      return data;
  }
};
var decodePacket_browser = decodePacket;

const SEPARATOR = String.fromCharCode(30);
const encodePayload = (packets, callback) => {
  const length = packets.length;
  const encodedPackets = new Array(length);
  let count = 0;
  packets.forEach((packet, i) => {
    encodePacket_browser(packet, false, encodedPacket => {
      encodedPackets[i] = encodedPacket;
      if (++count === length) {
        callback(encodedPackets.join(SEPARATOR));
      }
    });
  });
};
const decodePayload = (encodedPayload, binaryType) => {
  const encodedPackets = encodedPayload.split(SEPARATOR);
  const packets = [];
  for (let i = 0; i < encodedPackets.length; i++) {
    const decodedPacket = decodePacket_browser(encodedPackets[i], binaryType);
    packets.push(decodedPacket);
    if (decodedPacket.type === "error") {
      break;
    }
  }
  return packets;
};
var lib = {
  protocol: 4,
  encodePacket: encodePacket_browser,
  encodePayload,
  decodePacket: decodePacket_browser,
  decodePayload
};

var componentEmitter = createCommonjsModule(function (module) {
{
  module.exports = Emitter;
}
function Emitter(obj) {
  if (obj) return mixin(obj);
}
function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}
Emitter.prototype.on = Emitter.prototype.addEventListener = function (event, fn) {
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || []).push(fn);
  return this;
};
Emitter.prototype.once = function (event, fn) {
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }
  on.fn = fn;
  this.on(event, on);
  return this;
};
Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function (event, fn) {
  this._callbacks = this._callbacks || {};
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  if (callbacks.length === 0) {
    delete this._callbacks['$' + event];
  }
  return this;
};
Emitter.prototype.emit = function (event) {
  this._callbacks = this._callbacks || {};
  var args = new Array(arguments.length - 1),
      callbacks = this._callbacks['$' + event];
  for (var i = 1; i < arguments.length; i++) {
    args[i - 1] = arguments[i];
  }
  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }
  return this;
};
Emitter.prototype.listeners = function (event) {
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};
Emitter.prototype.hasListeners = function (event) {
  return !!this.listeners(event).length;
};
});

class Transport extends componentEmitter {
  constructor(opts) {
    super();
    this.opts = opts;
    this.query = opts.query;
    this.readyState = "";
    this.socket = opts.socket;
  }
  onError(msg, desc) {
    const err = new Error(msg);
    err.type = "TransportError";
    err.description = desc;
    this.emit("error", err);
    return this;
  }
  open() {
    if ("closed" === this.readyState || "" === this.readyState) {
      this.readyState = "opening";
      this.doOpen();
    }
    return this;
  }
  close() {
    if ("opening" === this.readyState || "open" === this.readyState) {
      this.doClose();
      this.onClose();
    }
    return this;
  }
  send(packets) {
    if ("open" === this.readyState) {
      this.write(packets);
    } else {
      throw new Error("Transport not open");
    }
  }
  onOpen() {
    this.readyState = "open";
    this.writable = true;
    this.emit("open");
  }
  onData(data) {
    const packet = lib.decodePacket(data, this.socket.binaryType);
    this.onPacket(packet);
  }
  onPacket(packet) {
    this.emit("packet", packet);
  }
  onClose() {
    this.readyState = "closed";
    this.emit("close");
  }
}
var transport = Transport;

var encode = function (obj) {
  var str = '';
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      if (str.length) str += '&';
      str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
    }
  }
  return str;
};
var decode = function (qs) {
  var qry = {};
  var pairs = qs.split('&');
  for (var i = 0, l = pairs.length; i < l; i++) {
    var pair = pairs[i].split('=');
    qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return qry;
};
var parseqs = {
	encode: encode,
	decode: decode
};

var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split(''),
    length = 64,
    map = {},
    seed = 0,
    i = 0,
    prev;
function encode$1(num) {
  var encoded = '';
  do {
    encoded = alphabet[num % length] + encoded;
    num = Math.floor(num / length);
  } while (num > 0);
  return encoded;
}
function decode$1(str) {
  var decoded = 0;
  for (i = 0; i < str.length; i++) {
    decoded = decoded * length + map[str.charAt(i)];
  }
  return decoded;
}
function yeast() {
  var now = encode$1(+new Date());
  if (now !== prev) return seed = 0, prev = now;
  return now + '.' + encode$1(seed++);
}
for (; i < length; i++) map[alphabet[i]] = i;
yeast.encode = encode$1;
yeast.decode = decode$1;
var yeast_1 = yeast;

const debug = browser("engine.io-client:polling");
class Polling extends transport {
  get name() {
    return "polling";
  }
  doOpen() {
    this.poll();
  }
  pause(onPause) {
    const self = this;
    this.readyState = "pausing";
    function pause() {
      debug("paused");
      self.readyState = "paused";
      onPause();
    }
    if (this.polling || !this.writable) {
      let total = 0;
      if (this.polling) {
        debug("we are currently polling - waiting to pause");
        total++;
        this.once("pollComplete", function () {
          debug("pre-pause polling complete");
          --total || pause();
        });
      }
      if (!this.writable) {
        debug("we are currently writing - waiting to pause");
        total++;
        this.once("drain", function () {
          debug("pre-pause writing complete");
          --total || pause();
        });
      }
    } else {
      pause();
    }
  }
  poll() {
    debug("polling");
    this.polling = true;
    this.doPoll();
    this.emit("poll");
  }
  onData(data) {
    const self = this;
    debug("polling got data %s", data);
    const callback = function (packet, index, total) {
      if ("opening" === self.readyState && packet.type === "open") {
        self.onOpen();
      }
      if ("close" === packet.type) {
        self.onClose();
        return false;
      }
      self.onPacket(packet);
    };
    lib.decodePayload(data, this.socket.binaryType).forEach(callback);
    if ("closed" !== this.readyState) {
      this.polling = false;
      this.emit("pollComplete");
      if ("open" === this.readyState) {
        this.poll();
      } else {
        debug('ignoring poll - transport state "%s"', this.readyState);
      }
    }
  }
  doClose() {
    const self = this;
    function close() {
      debug("writing close packet");
      self.write([{
        type: "close"
      }]);
    }
    if ("open" === this.readyState) {
      debug("transport open - closing");
      close();
    } else {
      debug("transport not open - deferring close");
      this.once("open", close);
    }
  }
  write(packets) {
    this.writable = false;
    lib.encodePayload(packets, data => {
      this.doWrite(data, () => {
        this.writable = true;
        this.emit("drain");
      });
    });
  }
  uri() {
    let query = this.query || {};
    const schema = this.opts.secure ? "https" : "http";
    let port = "";
    if (false !== this.opts.timestampRequests) {
      query[this.opts.timestampParam] = yeast_1();
    }
    if (!this.supportsBinary && !query.sid) {
      query.b64 = 1;
    }
    query = parseqs.encode(query);
    if (this.opts.port && ("https" === schema && Number(this.opts.port) !== 443 || "http" === schema && Number(this.opts.port) !== 80)) {
      port = ":" + this.opts.port;
    }
    if (query.length) {
      query = "?" + query;
    }
    const ipv6 = this.opts.hostname.indexOf(":") !== -1;
    return schema + "://" + (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) + port + this.opts.path + query;
  }
}
var polling = Polling;

var pick = (obj, ...attr) => {
  return attr.reduce((acc, k) => {
    if (obj.hasOwnProperty(k)) {
      acc[k] = obj[k];
    }
    return acc;
  }, {});
};
var util = {
	pick: pick
};

const {
  pick: pick$1
} = util;
const debug$1 = browser("engine.io-client:polling-xhr");
function empty() {}
const hasXHR2 = function () {
  const xhr = new xmlhttprequest({
    xdomain: false
  });
  return null != xhr.responseType;
}();
class XHR extends polling {
  constructor(opts) {
    super(opts);
    if (typeof location !== "undefined") {
      const isSSL = "https:" === location.protocol;
      let port = location.port;
      if (!port) {
        port = isSSL ? 443 : 80;
      }
      this.xd = typeof location !== "undefined" && opts.hostname !== location.hostname || port !== opts.port;
      this.xs = opts.secure !== isSSL;
    }
    const forceBase64 = opts && opts.forceBase64;
    this.supportsBinary = hasXHR2 && !forceBase64;
  }
  request(opts = {}) {
    Object.assign(opts, {
      xd: this.xd,
      xs: this.xs
    }, this.opts);
    return new Request(this.uri(), opts);
  }
  doWrite(data, fn) {
    const req = this.request({
      method: "POST",
      data: data
    });
    const self = this;
    req.on("success", fn);
    req.on("error", function (err) {
      self.onError("xhr post error", err);
    });
  }
  doPoll() {
    debug$1("xhr poll");
    const req = this.request();
    const self = this;
    req.on("data", function (data) {
      self.onData(data);
    });
    req.on("error", function (err) {
      self.onError("xhr poll error", err);
    });
    this.pollXhr = req;
  }
}
class Request extends componentEmitter {
  constructor(uri, opts) {
    super();
    this.opts = opts;
    this.method = opts.method || "GET";
    this.uri = uri;
    this.async = false !== opts.async;
    this.data = undefined !== opts.data ? opts.data : null;
    this.create();
  }
  create() {
    const opts = pick$1(this.opts, "agent", "enablesXDR", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized");
    opts.xdomain = !!this.opts.xd;
    opts.xscheme = !!this.opts.xs;
    const xhr = this.xhr = new xmlhttprequest(opts);
    const self = this;
    try {
      debug$1("xhr open %s: %s", this.method, this.uri);
      xhr.open(this.method, this.uri, this.async);
      try {
        if (this.opts.extraHeaders) {
          xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
          for (let i in this.opts.extraHeaders) {
            if (this.opts.extraHeaders.hasOwnProperty(i)) {
              xhr.setRequestHeader(i, this.opts.extraHeaders[i]);
            }
          }
        }
      } catch (e) {}
      if ("POST" === this.method) {
        try {
          xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
        } catch (e) {}
      }
      try {
        xhr.setRequestHeader("Accept", "*/*");
      } catch (e) {}
      if ("withCredentials" in xhr) {
        xhr.withCredentials = this.opts.withCredentials;
      }
      if (this.opts.requestTimeout) {
        xhr.timeout = this.opts.requestTimeout;
      }
      if (this.hasXDR()) {
        xhr.onload = function () {
          self.onLoad();
        };
        xhr.onerror = function () {
          self.onError(xhr.responseText);
        };
      } else {
        xhr.onreadystatechange = function () {
          if (4 !== xhr.readyState) return;
          if (200 === xhr.status || 1223 === xhr.status) {
            self.onLoad();
          } else {
            setTimeout(function () {
              self.onError(typeof xhr.status === "number" ? xhr.status : 0);
            }, 0);
          }
        };
      }
      debug$1("xhr data %s", this.data);
      xhr.send(this.data);
    } catch (e) {
      setTimeout(function () {
        self.onError(e);
      }, 0);
      return;
    }
    if (typeof document !== "undefined") {
      this.index = Request.requestsCount++;
      Request.requests[this.index] = this;
    }
  }
  onSuccess() {
    this.emit("success");
    this.cleanup();
  }
  onData(data) {
    this.emit("data", data);
    this.onSuccess();
  }
  onError(err) {
    this.emit("error", err);
    this.cleanup(true);
  }
  cleanup(fromError) {
    if ("undefined" === typeof this.xhr || null === this.xhr) {
      return;
    }
    if (this.hasXDR()) {
      this.xhr.onload = this.xhr.onerror = empty;
    } else {
      this.xhr.onreadystatechange = empty;
    }
    if (fromError) {
      try {
        this.xhr.abort();
      } catch (e) {}
    }
    if (typeof document !== "undefined") {
      delete Request.requests[this.index];
    }
    this.xhr = null;
  }
  onLoad() {
    const data = this.xhr.responseText;
    if (data !== null) {
      this.onData(data);
    }
  }
  hasXDR() {
    return typeof XDomainRequest !== "undefined" && !this.xs && this.enablesXDR;
  }
  abort() {
    this.cleanup();
  }
}
Request.requestsCount = 0;
Request.requests = {};
if (typeof document !== "undefined") {
  if (typeof attachEvent === "function") {
    attachEvent("onunload", unloadHandler);
  } else if (typeof addEventListener === "function") {
    const terminationEvent = "onpagehide" in globalThis_browser ? "pagehide" : "unload";
    addEventListener(terminationEvent, unloadHandler, false);
  }
}
function unloadHandler() {
  for (let i in Request.requests) {
    if (Request.requests.hasOwnProperty(i)) {
      Request.requests[i].abort();
    }
  }
}
var pollingXhr = XHR;
var Request_1 = Request;
pollingXhr.Request = Request_1;

const rNewline = /\n/g;
const rEscapedNewline = /\\n/g;
let callbacks;
function empty$1() {}
class JSONPPolling extends polling {
  constructor(opts) {
    super(opts);
    this.query = this.query || {};
    if (!callbacks) {
      callbacks = globalThis_browser.___eio = globalThis_browser.___eio || [];
    }
    this.index = callbacks.length;
    const self = this;
    callbacks.push(function (msg) {
      self.onData(msg);
    });
    this.query.j = this.index;
    if (typeof addEventListener === "function") {
      addEventListener("beforeunload", function () {
        if (self.script) self.script.onerror = empty$1;
      }, false);
    }
  }
  get supportsBinary() {
    return false;
  }
  doClose() {
    if (this.script) {
      this.script.parentNode.removeChild(this.script);
      this.script = null;
    }
    if (this.form) {
      this.form.parentNode.removeChild(this.form);
      this.form = null;
      this.iframe = null;
    }
    super.doClose();
  }
  doPoll() {
    const self = this;
    const script = document.createElement("script");
    if (this.script) {
      this.script.parentNode.removeChild(this.script);
      this.script = null;
    }
    script.async = true;
    script.src = this.uri();
    script.onerror = function (e) {
      self.onError("jsonp poll error", e);
    };
    const insertAt = document.getElementsByTagName("script")[0];
    if (insertAt) {
      insertAt.parentNode.insertBefore(script, insertAt);
    } else {
      (document.head || document.body).appendChild(script);
    }
    this.script = script;
    const isUAgecko = "undefined" !== typeof navigator && /gecko/i.test(navigator.userAgent);
    if (isUAgecko) {
      setTimeout(function () {
        const iframe = document.createElement("iframe");
        document.body.appendChild(iframe);
        document.body.removeChild(iframe);
      }, 100);
    }
  }
  doWrite(data, fn) {
    const self = this;
    let iframe;
    if (!this.form) {
      const form = document.createElement("form");
      const area = document.createElement("textarea");
      const id = this.iframeId = "eio_iframe_" + this.index;
      form.className = "socketio";
      form.style.position = "absolute";
      form.style.top = "-1000px";
      form.style.left = "-1000px";
      form.target = id;
      form.method = "POST";
      form.setAttribute("accept-charset", "utf-8");
      area.name = "d";
      form.appendChild(area);
      document.body.appendChild(form);
      this.form = form;
      this.area = area;
    }
    this.form.action = this.uri();
    function complete() {
      initIframe();
      fn();
    }
    function initIframe() {
      if (self.iframe) {
        try {
          self.form.removeChild(self.iframe);
        } catch (e) {
          self.onError("jsonp polling iframe removal error", e);
        }
      }
      try {
        const html = '<iframe src="javascript:0" name="' + self.iframeId + '">';
        iframe = document.createElement(html);
      } catch (e) {
        iframe = document.createElement("iframe");
        iframe.name = self.iframeId;
        iframe.src = "javascript:0";
      }
      iframe.id = self.iframeId;
      self.form.appendChild(iframe);
      self.iframe = iframe;
    }
    initIframe();
    data = data.replace(rEscapedNewline, "\\\n");
    this.area.value = data.replace(rNewline, "\\n");
    try {
      this.form.submit();
    } catch (e) {}
    if (this.iframe.attachEvent) {
      this.iframe.onreadystatechange = function () {
        if (self.iframe.readyState === "complete") {
          complete();
        }
      };
    } else {
      this.iframe.onload = complete;
    }
  }
}
var pollingJsonp = JSONPPolling;

var websocketConstructor_browser = {
  WebSocket: globalThis_browser.WebSocket || globalThis_browser.MozWebSocket,
  usingBrowserWebSocket: true,
  defaultBinaryType: "arraybuffer"
};

const {
  pick: pick$2
} = util;
const {
  WebSocket,
  usingBrowserWebSocket,
  defaultBinaryType
} = websocketConstructor_browser;
const debug$2 = browser("engine.io-client:websocket");
const isReactNative = typeof navigator !== "undefined" && typeof navigator.product === "string" && navigator.product.toLowerCase() === "reactnative";
class WS extends transport {
  constructor(opts) {
    super(opts);
    this.supportsBinary = !opts.forceBase64;
  }
  get name() {
    return "websocket";
  }
  doOpen() {
    if (!this.check()) {
      return;
    }
    const uri = this.uri();
    const protocols = this.opts.protocols;
    const opts = isReactNative ? {} : pick$2(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
    if (this.opts.extraHeaders) {
      opts.headers = this.opts.extraHeaders;
    }
    try {
      this.ws = usingBrowserWebSocket && !isReactNative ? protocols ? new WebSocket(uri, protocols) : new WebSocket(uri) : new WebSocket(uri, protocols, opts);
    } catch (err) {
      return this.emit("error", err);
    }
    this.ws.binaryType = this.socket.binaryType || defaultBinaryType;
    this.addEventListeners();
  }
  addEventListeners() {
    const self = this;
    this.ws.onopen = function () {
      self.onOpen();
    };
    this.ws.onclose = function () {
      self.onClose();
    };
    this.ws.onmessage = function (ev) {
      self.onData(ev.data);
    };
    this.ws.onerror = function (e) {
      self.onError("websocket error", e);
    };
  }
  write(packets) {
    const self = this;
    this.writable = false;
    let total = packets.length;
    let i = 0;
    const l = total;
    for (; i < l; i++) {
      (function (packet) {
        lib.encodePacket(packet, self.supportsBinary, function (data) {
          const opts = {};
          if (!usingBrowserWebSocket) {
            if (packet.options) {
              opts.compress = packet.options.compress;
            }
            if (self.opts.perMessageDeflate) {
              const len = "string" === typeof data ? Buffer.byteLength(data) : data.length;
              if (len < self.opts.perMessageDeflate.threshold) {
                opts.compress = false;
              }
            }
          }
          try {
            if (usingBrowserWebSocket) {
              self.ws.send(data);
            } else {
              self.ws.send(data, opts);
            }
          } catch (e) {
            debug$2("websocket closed before onclose event");
          }
          --total || done();
        });
      })(packets[i]);
    }
    function done() {
      self.emit("flush");
      setTimeout(function () {
        self.writable = true;
        self.emit("drain");
      }, 0);
    }
  }
  onClose() {
    transport.prototype.onClose.call(this);
  }
  doClose() {
    if (typeof this.ws !== "undefined") {
      this.ws.close();
    }
  }
  uri() {
    let query = this.query || {};
    const schema = this.opts.secure ? "wss" : "ws";
    let port = "";
    if (this.opts.port && ("wss" === schema && Number(this.opts.port) !== 443 || "ws" === schema && Number(this.opts.port) !== 80)) {
      port = ":" + this.opts.port;
    }
    if (this.opts.timestampRequests) {
      query[this.opts.timestampParam] = yeast_1();
    }
    if (!this.supportsBinary) {
      query.b64 = 1;
    }
    query = parseqs.encode(query);
    if (query.length) {
      query = "?" + query;
    }
    const ipv6 = this.opts.hostname.indexOf(":") !== -1;
    return schema + "://" + (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) + port + this.opts.path + query;
  }
  check() {
    return !!WebSocket && !("__initialize" in WebSocket && this.name === WS.prototype.name);
  }
}
var websocket = WS;

var polling_1 = polling$1;
var websocket_1 = websocket;
function polling$1(opts) {
  let xhr;
  let xd = false;
  let xs = false;
  const jsonp = false !== opts.jsonp;
  if (typeof location !== "undefined") {
    const isSSL = "https:" === location.protocol;
    let port = location.port;
    if (!port) {
      port = isSSL ? 443 : 80;
    }
    xd = opts.hostname !== location.hostname || port !== opts.port;
    xs = opts.secure !== isSSL;
  }
  opts.xdomain = xd;
  opts.xscheme = xs;
  xhr = new xmlhttprequest(opts);
  if ("open" in xhr && !opts.forceJSONP) {
    return new pollingXhr(opts);
  } else {
    if (!jsonp) throw new Error("JSONP disabled");
    return new pollingJsonp(opts);
  }
}
var transports = {
	polling: polling_1,
	websocket: websocket_1
};

const debug$3 = browser("engine.io-client:socket");
class Socket extends componentEmitter {
  constructor(uri, opts = {}) {
    super();
    if (uri && "object" === typeof uri) {
      opts = uri;
      uri = null;
    }
    if (uri) {
      uri = parseuri(uri);
      opts.hostname = uri.host;
      opts.secure = uri.protocol === "https" || uri.protocol === "wss";
      opts.port = uri.port;
      if (uri.query) opts.query = uri.query;
    } else if (opts.host) {
      opts.hostname = parseuri(opts.host).host;
    }
    this.secure = null != opts.secure ? opts.secure : typeof location !== "undefined" && "https:" === location.protocol;
    if (opts.hostname && !opts.port) {
      opts.port = this.secure ? "443" : "80";
    }
    this.hostname = opts.hostname || (typeof location !== "undefined" ? location.hostname : "localhost");
    this.port = opts.port || (typeof location !== "undefined" && location.port ? location.port : this.secure ? 443 : 80);
    this.transports = opts.transports || ["polling", "websocket"];
    this.readyState = "";
    this.writeBuffer = [];
    this.prevBufferLen = 0;
    this.opts = Object.assign({
      path: "/engine.io",
      agent: false,
      withCredentials: false,
      upgrade: true,
      jsonp: true,
      timestampParam: "t",
      rememberUpgrade: false,
      rejectUnauthorized: true,
      perMessageDeflate: {
        threshold: 1024
      },
      transportOptions: {}
    }, opts);
    this.opts.path = this.opts.path.replace(/\/$/, "") + "/";
    if (typeof this.opts.query === "string") {
      this.opts.query = parseqs.decode(this.opts.query);
    }
    this.id = null;
    this.upgrades = null;
    this.pingInterval = null;
    this.pingTimeout = null;
    this.pingTimeoutTimer = null;
    this.open();
  }
  createTransport(name) {
    debug$3('creating transport "%s"', name);
    const query = clone(this.opts.query);
    query.EIO = lib.protocol;
    query.transport = name;
    if (this.id) query.sid = this.id;
    const opts = Object.assign({}, this.opts.transportOptions[name], this.opts, {
      query,
      socket: this,
      hostname: this.hostname,
      secure: this.secure,
      port: this.port
    });
    debug$3("options: %j", opts);
    return new transports[name](opts);
  }
  open() {
    let transport;
    if (this.opts.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1) {
      transport = "websocket";
    } else if (0 === this.transports.length) {
      const self = this;
      setTimeout(function () {
        self.emit("error", "No transports available");
      }, 0);
      return;
    } else {
      transport = this.transports[0];
    }
    this.readyState = "opening";
    try {
      transport = this.createTransport(transport);
    } catch (e) {
      debug$3("error while creating transport: %s", e);
      this.transports.shift();
      this.open();
      return;
    }
    transport.open();
    this.setTransport(transport);
  }
  setTransport(transport) {
    debug$3("setting transport %s", transport.name);
    const self = this;
    if (this.transport) {
      debug$3("clearing existing transport %s", this.transport.name);
      this.transport.removeAllListeners();
    }
    this.transport = transport;
    transport.on("drain", function () {
      self.onDrain();
    }).on("packet", function (packet) {
      self.onPacket(packet);
    }).on("error", function (e) {
      self.onError(e);
    }).on("close", function () {
      self.onClose("transport close");
    });
  }
  probe(name) {
    debug$3('probing transport "%s"', name);
    let transport = this.createTransport(name, {
      probe: 1
    });
    let failed = false;
    const self = this;
    Socket.priorWebsocketSuccess = false;
    function onTransportOpen() {
      if (self.onlyBinaryUpgrades) {
        const upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
        failed = failed || upgradeLosesBinary;
      }
      if (failed) return;
      debug$3('probe transport "%s" opened', name);
      transport.send([{
        type: "ping",
        data: "probe"
      }]);
      transport.once("packet", function (msg) {
        if (failed) return;
        if ("pong" === msg.type && "probe" === msg.data) {
          debug$3('probe transport "%s" pong', name);
          self.upgrading = true;
          self.emit("upgrading", transport);
          if (!transport) return;
          Socket.priorWebsocketSuccess = "websocket" === transport.name;
          debug$3('pausing current transport "%s"', self.transport.name);
          self.transport.pause(function () {
            if (failed) return;
            if ("closed" === self.readyState) return;
            debug$3("changing transport and sending upgrade packet");
            cleanup();
            self.setTransport(transport);
            transport.send([{
              type: "upgrade"
            }]);
            self.emit("upgrade", transport);
            transport = null;
            self.upgrading = false;
            self.flush();
          });
        } else {
          debug$3('probe transport "%s" failed', name);
          const err = new Error("probe error");
          err.transport = transport.name;
          self.emit("upgradeError", err);
        }
      });
    }
    function freezeTransport() {
      if (failed) return;
      failed = true;
      cleanup();
      transport.close();
      transport = null;
    }
    function onerror(err) {
      const error = new Error("probe error: " + err);
      error.transport = transport.name;
      freezeTransport();
      debug$3('probe transport "%s" failed because of error: %s', name, err);
      self.emit("upgradeError", error);
    }
    function onTransportClose() {
      onerror("transport closed");
    }
    function onclose() {
      onerror("socket closed");
    }
    function onupgrade(to) {
      if (transport && to.name !== transport.name) {
        debug$3('"%s" works - aborting "%s"', to.name, transport.name);
        freezeTransport();
      }
    }
    function cleanup() {
      transport.removeListener("open", onTransportOpen);
      transport.removeListener("error", onerror);
      transport.removeListener("close", onTransportClose);
      self.removeListener("close", onclose);
      self.removeListener("upgrading", onupgrade);
    }
    transport.once("open", onTransportOpen);
    transport.once("error", onerror);
    transport.once("close", onTransportClose);
    this.once("close", onclose);
    this.once("upgrading", onupgrade);
    transport.open();
  }
  onOpen() {
    debug$3("socket open");
    this.readyState = "open";
    Socket.priorWebsocketSuccess = "websocket" === this.transport.name;
    this.emit("open");
    this.flush();
    if ("open" === this.readyState && this.opts.upgrade && this.transport.pause) {
      debug$3("starting upgrade probes");
      let i = 0;
      const l = this.upgrades.length;
      for (; i < l; i++) {
        this.probe(this.upgrades[i]);
      }
    }
  }
  onPacket(packet) {
    if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
      debug$3('socket receive: type "%s", data "%s"', packet.type, packet.data);
      this.emit("packet", packet);
      this.emit("heartbeat");
      switch (packet.type) {
        case "open":
          this.onHandshake(JSON.parse(packet.data));
          break;
        case "ping":
          this.resetPingTimeout();
          this.sendPacket("pong");
          this.emit("pong");
          break;
        case "error":
          const err = new Error("server error");
          err.code = packet.data;
          this.onError(err);
          break;
        case "message":
          this.emit("data", packet.data);
          this.emit("message", packet.data);
          break;
      }
    } else {
      debug$3('packet received with socket readyState "%s"', this.readyState);
    }
  }
  onHandshake(data) {
    this.emit("handshake", data);
    this.id = data.sid;
    this.transport.query.sid = data.sid;
    this.upgrades = this.filterUpgrades(data.upgrades);
    this.pingInterval = data.pingInterval;
    this.pingTimeout = data.pingTimeout;
    this.onOpen();
    if ("closed" === this.readyState) return;
    this.resetPingTimeout();
  }
  resetPingTimeout() {
    clearTimeout(this.pingTimeoutTimer);
    this.pingTimeoutTimer = setTimeout(() => {
      this.onClose("ping timeout");
    }, this.pingInterval + this.pingTimeout);
  }
  onDrain() {
    this.writeBuffer.splice(0, this.prevBufferLen);
    this.prevBufferLen = 0;
    if (0 === this.writeBuffer.length) {
      this.emit("drain");
    } else {
      this.flush();
    }
  }
  flush() {
    if ("closed" !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
      debug$3("flushing %d packets in socket", this.writeBuffer.length);
      this.transport.send(this.writeBuffer);
      this.prevBufferLen = this.writeBuffer.length;
      this.emit("flush");
    }
  }
  write(msg, options, fn) {
    this.sendPacket("message", msg, options, fn);
    return this;
  }
  send(msg, options, fn) {
    this.sendPacket("message", msg, options, fn);
    return this;
  }
  sendPacket(type, data, options, fn) {
    if ("function" === typeof data) {
      fn = data;
      data = undefined;
    }
    if ("function" === typeof options) {
      fn = options;
      options = null;
    }
    if ("closing" === this.readyState || "closed" === this.readyState) {
      return;
    }
    options = options || {};
    options.compress = false !== options.compress;
    const packet = {
      type: type,
      data: data,
      options: options
    };
    this.emit("packetCreate", packet);
    this.writeBuffer.push(packet);
    if (fn) this.once("flush", fn);
    this.flush();
  }
  close() {
    const self = this;
    if ("opening" === this.readyState || "open" === this.readyState) {
      this.readyState = "closing";
      if (this.writeBuffer.length) {
        this.once("drain", function () {
          if (this.upgrading) {
            waitForUpgrade();
          } else {
            close();
          }
        });
      } else if (this.upgrading) {
        waitForUpgrade();
      } else {
        close();
      }
    }
    function close() {
      self.onClose("forced close");
      debug$3("socket closing - telling transport to close");
      self.transport.close();
    }
    function cleanupAndClose() {
      self.removeListener("upgrade", cleanupAndClose);
      self.removeListener("upgradeError", cleanupAndClose);
      close();
    }
    function waitForUpgrade() {
      self.once("upgrade", cleanupAndClose);
      self.once("upgradeError", cleanupAndClose);
    }
    return this;
  }
  onError(err) {
    debug$3("socket error %j", err);
    Socket.priorWebsocketSuccess = false;
    this.emit("error", err);
    this.onClose("transport error", err);
  }
  onClose(reason, desc) {
    if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
      debug$3('socket close with reason: "%s"', reason);
      const self = this;
      clearTimeout(this.pingIntervalTimer);
      clearTimeout(this.pingTimeoutTimer);
      this.transport.removeAllListeners("close");
      this.transport.close();
      this.transport.removeAllListeners();
      this.readyState = "closed";
      this.id = null;
      this.emit("close", reason, desc);
      self.writeBuffer = [];
      self.prevBufferLen = 0;
    }
  }
  filterUpgrades(upgrades) {
    const filteredUpgrades = [];
    let i = 0;
    const j = upgrades.length;
    for (; i < j; i++) {
      if (~this.transports.indexOf(upgrades[i])) filteredUpgrades.push(upgrades[i]);
    }
    return filteredUpgrades;
  }
}
Socket.priorWebsocketSuccess = false;
Socket.protocol = lib.protocol;
function clone(obj) {
  const o = {};
  for (let i in obj) {
    if (obj.hasOwnProperty(i)) {
      o[i] = obj[i];
    }
  }
  return o;
}
var socket = Socket;

var lib$1 = (uri, opts) => new socket(uri, opts);
var Socket_1 = socket;
var protocol = socket.protocol;
var Transport$1 = transport;
var transports$1 = transports;
var parser = lib;
lib$1.Socket = Socket_1;
lib$1.protocol = protocol;
lib$1.Transport = Transport$1;
lib$1.transports = transports$1;
lib$1.parser = parser;

var isBinary_1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasBinary = exports.isBinary = void 0;
const withNativeArrayBuffer = typeof ArrayBuffer === "function";
const isView = obj => {
  return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
};
const toString = Object.prototype.toString;
const withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && toString.call(Blob) === "[object BlobConstructor]";
const withNativeFile = typeof File === "function" || typeof File !== "undefined" && toString.call(File) === "[object FileConstructor]";
function isBinary(obj) {
  return withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj)) || withNativeBlob && obj instanceof Blob || withNativeFile && obj instanceof File;
}
exports.isBinary = isBinary;
function hasBinary(obj, toJSON) {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  if (Array.isArray(obj)) {
    for (let i = 0, l = obj.length; i < l; i++) {
      if (hasBinary(obj[i])) {
        return true;
      }
    }
    return false;
  }
  if (isBinary(obj)) {
    return true;
  }
  if (obj.toJSON && typeof obj.toJSON === "function" && arguments.length === 1) {
    return hasBinary(obj.toJSON(), true);
  }
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
      return true;
    }
  }
  return false;
}
exports.hasBinary = hasBinary;
});
unwrapExports(isBinary_1);
isBinary_1.hasBinary;
isBinary_1.isBinary;

var binary = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reconstructPacket = exports.deconstructPacket = void 0;
function deconstructPacket(packet) {
  const buffers = [];
  const packetData = packet.data;
  const pack = packet;
  pack.data = _deconstructPacket(packetData, buffers);
  pack.attachments = buffers.length;
  return {
    packet: pack,
    buffers: buffers
  };
}
exports.deconstructPacket = deconstructPacket;
function _deconstructPacket(data, buffers) {
  if (!data) return data;
  if (isBinary_1.isBinary(data)) {
    const placeholder = {
      _placeholder: true,
      num: buffers.length
    };
    buffers.push(data);
    return placeholder;
  } else if (Array.isArray(data)) {
    const newData = new Array(data.length);
    for (let i = 0; i < data.length; i++) {
      newData[i] = _deconstructPacket(data[i], buffers);
    }
    return newData;
  } else if (typeof data === "object" && !(data instanceof Date)) {
    const newData = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        newData[key] = _deconstructPacket(data[key], buffers);
      }
    }
    return newData;
  }
  return data;
}
function reconstructPacket(packet, buffers) {
  packet.data = _reconstructPacket(packet.data, buffers);
  packet.attachments = undefined;
  return packet;
}
exports.reconstructPacket = reconstructPacket;
function _reconstructPacket(data, buffers) {
  if (!data) return data;
  if (data && data._placeholder) {
    return buffers[data.num];
  } else if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      data[i] = _reconstructPacket(data[i], buffers);
    }
  } else if (typeof data === "object") {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        data[key] = _reconstructPacket(data[key], buffers);
      }
    }
  }
  return data;
}
});
unwrapExports(binary);
binary.reconstructPacket;
binary.deconstructPacket;

var dist = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Decoder = exports.Encoder = exports.PacketType = exports.protocol = void 0;
const debug = browser("socket.io-parser");
exports.protocol = 5;
var PacketType;
(function (PacketType) {
  PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
  PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
  PacketType[PacketType["EVENT"] = 2] = "EVENT";
  PacketType[PacketType["ACK"] = 3] = "ACK";
  PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
  PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
  PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
})(PacketType = exports.PacketType || (exports.PacketType = {}));
class Encoder {
  encode(obj) {
    debug("encoding packet %j", obj);
    if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
      if (isBinary_1.hasBinary(obj)) {
        obj.type = obj.type === PacketType.EVENT ? PacketType.BINARY_EVENT : PacketType.BINARY_ACK;
        return this.encodeAsBinary(obj);
      }
    }
    return [this.encodeAsString(obj)];
  }
  encodeAsString(obj) {
    let str = "" + obj.type;
    if (obj.type === PacketType.BINARY_EVENT || obj.type === PacketType.BINARY_ACK) {
      str += obj.attachments + "-";
    }
    if (obj.nsp && "/" !== obj.nsp) {
      str += obj.nsp + ",";
    }
    if (null != obj.id) {
      str += obj.id;
    }
    if (null != obj.data) {
      str += JSON.stringify(obj.data);
    }
    debug("encoded %j as %s", obj, str);
    return str;
  }
  encodeAsBinary(obj) {
    const deconstruction = binary.deconstructPacket(obj);
    const pack = this.encodeAsString(deconstruction.packet);
    const buffers = deconstruction.buffers;
    buffers.unshift(pack);
    return buffers;
  }
}
exports.Encoder = Encoder;
class Decoder extends componentEmitter {
  constructor() {
    super();
  }
  add(obj) {
    let packet;
    if (typeof obj === "string") {
      packet = this.decodeString(obj);
      if (packet.type === PacketType.BINARY_EVENT || packet.type === PacketType.BINARY_ACK) {
        this.reconstructor = new BinaryReconstructor(packet);
        if (packet.attachments === 0) {
          super.emit("decoded", packet);
        }
      } else {
        super.emit("decoded", packet);
      }
    } else if (isBinary_1.isBinary(obj) || obj.base64) {
      if (!this.reconstructor) {
        throw new Error("got binary data when not reconstructing a packet");
      } else {
        packet = this.reconstructor.takeBinaryData(obj);
        if (packet) {
          this.reconstructor = null;
          super.emit("decoded", packet);
        }
      }
    } else {
      throw new Error("Unknown type: " + obj);
    }
  }
  decodeString(str) {
    let i = 0;
    const p = {
      type: Number(str.charAt(0))
    };
    if (PacketType[p.type] === undefined) {
      throw new Error("unknown packet type " + p.type);
    }
    if (p.type === PacketType.BINARY_EVENT || p.type === PacketType.BINARY_ACK) {
      const start = i + 1;
      while (str.charAt(++i) !== "-" && i != str.length) {}
      const buf = str.substring(start, i);
      if (buf != Number(buf) || str.charAt(i) !== "-") {
        throw new Error("Illegal attachments");
      }
      p.attachments = Number(buf);
    }
    if ("/" === str.charAt(i + 1)) {
      const start = i + 1;
      while (++i) {
        const c = str.charAt(i);
        if ("," === c) break;
        if (i === str.length) break;
      }
      p.nsp = str.substring(start, i);
    } else {
      p.nsp = "/";
    }
    const next = str.charAt(i + 1);
    if ("" !== next && Number(next) == next) {
      const start = i + 1;
      while (++i) {
        const c = str.charAt(i);
        if (null == c || Number(c) != c) {
          --i;
          break;
        }
        if (i === str.length) break;
      }
      p.id = Number(str.substring(start, i + 1));
    }
    if (str.charAt(++i)) {
      const payload = tryParse(str.substr(i));
      if (Decoder.isPayloadValid(p.type, payload)) {
        p.data = payload;
      } else {
        throw new Error("invalid payload");
      }
    }
    debug("decoded %s as %j", str, p);
    return p;
  }
  static isPayloadValid(type, payload) {
    switch (type) {
      case PacketType.CONNECT:
        return typeof payload === "object";
      case PacketType.DISCONNECT:
        return payload === undefined;
      case PacketType.CONNECT_ERROR:
        return typeof payload === "string" || typeof payload === "object";
      case PacketType.EVENT:
      case PacketType.BINARY_EVENT:
        return Array.isArray(payload) && payload.length > 0;
      case PacketType.ACK:
      case PacketType.BINARY_ACK:
        return Array.isArray(payload);
    }
  }
  destroy() {
    if (this.reconstructor) {
      this.reconstructor.finishedReconstruction();
    }
  }
}
exports.Decoder = Decoder;
function tryParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return false;
  }
}
class BinaryReconstructor {
  constructor(packet) {
    this.packet = packet;
    this.buffers = [];
    this.reconPack = packet;
  }
  takeBinaryData(binData) {
    this.buffers.push(binData);
    if (this.buffers.length === this.reconPack.attachments) {
      const packet = binary.reconstructPacket(this.reconPack, this.buffers);
      this.finishedReconstruction();
      return packet;
    }
    return null;
  }
  finishedReconstruction() {
    this.reconPack = null;
    this.buffers = [];
  }
}
});
unwrapExports(dist);
dist.Decoder;
dist.Encoder;
dist.PacketType;
dist.protocol;

var on_1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.on = void 0;
function on(obj, ev, fn) {
  obj.on(ev, fn);
  return function subDestroy() {
    obj.off(ev, fn);
  };
}
exports.on = on;
});
unwrapExports(on_1);
on_1.on;

var socket$1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Socket = void 0;
const debug = browser("socket.io-client:socket");
const RESERVED_EVENTS = Object.freeze({
  connect: 1,
  connect_error: 1,
  disconnect: 1,
  disconnecting: 1,
  newListener: 1,
  removeListener: 1
});
class Socket extends componentEmitter {
  constructor(io, nsp, opts) {
    super();
    this.receiveBuffer = [];
    this.sendBuffer = [];
    this.ids = 0;
    this.acks = {};
    this.flags = {};
    this.io = io;
    this.nsp = nsp;
    this.ids = 0;
    this.acks = {};
    this.receiveBuffer = [];
    this.sendBuffer = [];
    this.connected = false;
    this.disconnected = true;
    this.flags = {};
    if (opts && opts.auth) {
      this.auth = opts.auth;
    }
    if (this.io._autoConnect) this.open();
  }
  subEvents() {
    if (this.subs) return;
    const io = this.io;
    this.subs = [on_1.on(io, "open", this.onopen.bind(this)), on_1.on(io, "packet", this.onpacket.bind(this)), on_1.on(io, "error", this.onerror.bind(this)), on_1.on(io, "close", this.onclose.bind(this))];
  }
  get active() {
    return !!this.subs;
  }
  connect() {
    if (this.connected) return this;
    this.subEvents();
    if (!this.io["_reconnecting"]) this.io.open();
    if ("open" === this.io._readyState) this.onopen();
    return this;
  }
  open() {
    return this.connect();
  }
  send(...args) {
    args.unshift("message");
    this.emit.apply(this, args);
    return this;
  }
  emit(ev, ...args) {
    if (RESERVED_EVENTS.hasOwnProperty(ev)) {
      throw new Error('"' + ev + '" is a reserved event name');
    }
    args.unshift(ev);
    const packet = {
      type: dist.PacketType.EVENT,
      data: args
    };
    packet.options = {};
    packet.options.compress = this.flags.compress !== false;
    if ("function" === typeof args[args.length - 1]) {
      debug("emitting packet with ack id %d", this.ids);
      this.acks[this.ids] = args.pop();
      packet.id = this.ids++;
    }
    const isTransportWritable = this.io.engine && this.io.engine.transport && this.io.engine.transport.writable;
    const discardPacket = this.flags.volatile && (!isTransportWritable || !this.connected);
    if (discardPacket) {
      debug("discard packet as the transport is not currently writable");
    } else if (this.connected) {
      this.packet(packet);
    } else {
      this.sendBuffer.push(packet);
    }
    this.flags = {};
    return this;
  }
  packet(packet) {
    packet.nsp = this.nsp;
    this.io._packet(packet);
  }
  onopen() {
    debug("transport is open - connecting");
    if (typeof this.auth == "function") {
      this.auth(data => {
        this.packet({
          type: dist.PacketType.CONNECT,
          data
        });
      });
    } else {
      this.packet({
        type: dist.PacketType.CONNECT,
        data: this.auth
      });
    }
  }
  onerror(err) {
    if (!this.connected) {
      super.emit("connect_error", err);
    }
  }
  onclose(reason) {
    debug("close (%s)", reason);
    this.connected = false;
    this.disconnected = true;
    delete this.id;
    super.emit("disconnect", reason);
  }
  onpacket(packet) {
    const sameNamespace = packet.nsp === this.nsp;
    if (!sameNamespace) return;
    switch (packet.type) {
      case dist.PacketType.CONNECT:
        if (packet.data && packet.data.sid) {
          const id = packet.data.sid;
          this.onconnect(id);
        } else {
          super.emit("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
        }
        break;
      case dist.PacketType.EVENT:
        this.onevent(packet);
        break;
      case dist.PacketType.BINARY_EVENT:
        this.onevent(packet);
        break;
      case dist.PacketType.ACK:
        this.onack(packet);
        break;
      case dist.PacketType.BINARY_ACK:
        this.onack(packet);
        break;
      case dist.PacketType.DISCONNECT:
        this.ondisconnect();
        break;
      case dist.PacketType.CONNECT_ERROR:
        const err = new Error(packet.data.message);
        err.data = packet.data.data;
        super.emit("connect_error", err);
        break;
    }
  }
  onevent(packet) {
    const args = packet.data || [];
    debug("emitting event %j", args);
    if (null != packet.id) {
      debug("attaching ack callback to event");
      args.push(this.ack(packet.id));
    }
    if (this.connected) {
      this.emitEvent(args);
    } else {
      this.receiveBuffer.push(Object.freeze(args));
    }
  }
  emitEvent(args) {
    if (this._anyListeners && this._anyListeners.length) {
      const listeners = this._anyListeners.slice();
      for (const listener of listeners) {
        listener.apply(this, args);
      }
    }
    super.emit.apply(this, args);
  }
  ack(id) {
    const self = this;
    let sent = false;
    return function (...args) {
      if (sent) return;
      sent = true;
      debug("sending ack %j", args);
      self.packet({
        type: dist.PacketType.ACK,
        id: id,
        data: args
      });
    };
  }
  onack(packet) {
    const ack = this.acks[packet.id];
    if ("function" === typeof ack) {
      debug("calling ack %s with %j", packet.id, packet.data);
      ack.apply(this, packet.data);
      delete this.acks[packet.id];
    } else {
      debug("bad ack %s", packet.id);
    }
  }
  onconnect(id) {
    debug("socket connected with id %s", id);
    this.id = id;
    this.connected = true;
    this.disconnected = false;
    super.emit("connect");
    this.emitBuffered();
  }
  emitBuffered() {
    this.receiveBuffer.forEach(args => this.emitEvent(args));
    this.receiveBuffer = [];
    this.sendBuffer.forEach(packet => this.packet(packet));
    this.sendBuffer = [];
  }
  ondisconnect() {
    debug("server disconnect (%s)", this.nsp);
    this.destroy();
    this.onclose("io server disconnect");
  }
  destroy() {
    if (this.subs) {
      this.subs.forEach(subDestroy => subDestroy());
      this.subs = undefined;
    }
    this.io["_destroy"](this);
  }
  disconnect() {
    if (this.connected) {
      debug("performing disconnect (%s)", this.nsp);
      this.packet({
        type: dist.PacketType.DISCONNECT
      });
    }
    this.destroy();
    if (this.connected) {
      this.onclose("io client disconnect");
    }
    return this;
  }
  close() {
    return this.disconnect();
  }
  compress(compress) {
    this.flags.compress = compress;
    return this;
  }
  get volatile() {
    this.flags.volatile = true;
    return this;
  }
  onAny(listener) {
    this._anyListeners = this._anyListeners || [];
    this._anyListeners.push(listener);
    return this;
  }
  prependAny(listener) {
    this._anyListeners = this._anyListeners || [];
    this._anyListeners.unshift(listener);
    return this;
  }
  offAny(listener) {
    if (!this._anyListeners) {
      return this;
    }
    if (listener) {
      const listeners = this._anyListeners;
      for (let i = 0; i < listeners.length; i++) {
        if (listener === listeners[i]) {
          listeners.splice(i, 1);
          return this;
        }
      }
    } else {
      this._anyListeners = [];
    }
    return this;
  }
  listenersAny() {
    return this._anyListeners || [];
  }
}
exports.Socket = Socket;
});
unwrapExports(socket$1);
socket$1.Socket;

var backo2 = Backoff;
function Backoff(opts) {
  opts = opts || {};
  this.ms = opts.min || 100;
  this.max = opts.max || 10000;
  this.factor = opts.factor || 2;
  this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
  this.attempts = 0;
}
Backoff.prototype.duration = function () {
  var ms = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var rand = Math.random();
    var deviation = Math.floor(rand * this.jitter * ms);
    ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
  }
  return Math.min(ms, this.max) | 0;
};
Backoff.prototype.reset = function () {
  this.attempts = 0;
};
Backoff.prototype.setMin = function (min) {
  this.ms = min;
};
Backoff.prototype.setMax = function (max) {
  this.max = max;
};
Backoff.prototype.setJitter = function (jitter) {
  this.jitter = jitter;
};

var manager = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Manager = void 0;
const debug = browser("socket.io-client:manager");
class Manager extends componentEmitter {
  constructor(uri, opts) {
    super();
    this.nsps = {};
    this.subs = [];
    if (uri && "object" === typeof uri) {
      opts = uri;
      uri = undefined;
    }
    opts = opts || {};
    opts.path = opts.path || "/socket.io";
    this.opts = opts;
    this.reconnection(opts.reconnection !== false);
    this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
    this.reconnectionDelay(opts.reconnectionDelay || 1000);
    this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
    this.randomizationFactor(opts.randomizationFactor || 0.5);
    this.backoff = new backo2({
      min: this.reconnectionDelay(),
      max: this.reconnectionDelayMax(),
      jitter: this.randomizationFactor()
    });
    this.timeout(null == opts.timeout ? 20000 : opts.timeout);
    this._readyState = "closed";
    this.uri = uri;
    const _parser = opts.parser || dist;
    this.encoder = new _parser.Encoder();
    this.decoder = new _parser.Decoder();
    this._autoConnect = opts.autoConnect !== false;
    if (this._autoConnect) this.open();
  }
  reconnection(v) {
    if (!arguments.length) return this._reconnection;
    this._reconnection = !!v;
    return this;
  }
  reconnectionAttempts(v) {
    if (v === undefined) return this._reconnectionAttempts;
    this._reconnectionAttempts = v;
    return this;
  }
  reconnectionDelay(v) {
    var _a;
    if (v === undefined) return this._reconnectionDelay;
    this._reconnectionDelay = v;
    (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
    return this;
  }
  randomizationFactor(v) {
    var _a;
    if (v === undefined) return this._randomizationFactor;
    this._randomizationFactor = v;
    (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
    return this;
  }
  reconnectionDelayMax(v) {
    var _a;
    if (v === undefined) return this._reconnectionDelayMax;
    this._reconnectionDelayMax = v;
    (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
    return this;
  }
  timeout(v) {
    if (!arguments.length) return this._timeout;
    this._timeout = v;
    return this;
  }
  maybeReconnectOnOpen() {
    if (!this._reconnecting && this._reconnection && this.backoff.attempts === 0) {
      this.reconnect();
    }
  }
  open(fn) {
    debug("readyState %s", this._readyState);
    if (~this._readyState.indexOf("open")) return this;
    debug("opening %s", this.uri);
    this.engine = lib$1(this.uri, this.opts);
    const socket = this.engine;
    const self = this;
    this._readyState = "opening";
    this.skipReconnect = false;
    const openSubDestroy = on_1.on(socket, "open", function () {
      self.onopen();
      fn && fn();
    });
    const errorSub = on_1.on(socket, "error", err => {
      debug("error");
      self.cleanup();
      self._readyState = "closed";
      super.emit("error", err);
      if (fn) {
        fn(err);
      } else {
        self.maybeReconnectOnOpen();
      }
    });
    if (false !== this._timeout) {
      const timeout = this._timeout;
      debug("connect attempt will timeout after %d", timeout);
      if (timeout === 0) {
        openSubDestroy();
      }
      const timer = setTimeout(() => {
        debug("connect attempt timed out after %d", timeout);
        openSubDestroy();
        socket.close();
        socket.emit("error", new Error("timeout"));
      }, timeout);
      this.subs.push(function subDestroy() {
        clearTimeout(timer);
      });
    }
    this.subs.push(openSubDestroy);
    this.subs.push(errorSub);
    return this;
  }
  connect(fn) {
    return this.open(fn);
  }
  onopen() {
    debug("open");
    this.cleanup();
    this._readyState = "open";
    super.emit("open");
    const socket = this.engine;
    this.subs.push(on_1.on(socket, "ping", this.onping.bind(this)), on_1.on(socket, "data", this.ondata.bind(this)), on_1.on(socket, "error", this.onerror.bind(this)), on_1.on(socket, "close", this.onclose.bind(this)), on_1.on(this.decoder, "decoded", this.ondecoded.bind(this)));
  }
  onping() {
    super.emit("ping");
  }
  ondata(data) {
    this.decoder.add(data);
  }
  ondecoded(packet) {
    super.emit("packet", packet);
  }
  onerror(err) {
    debug("error", err);
    super.emit("error", err);
  }
  socket(nsp, opts) {
    let socket = this.nsps[nsp];
    if (!socket) {
      socket = new socket$1.Socket(this, nsp, opts);
      this.nsps[nsp] = socket;
    }
    return socket;
  }
  _destroy(socket) {
    const nsps = Object.keys(this.nsps);
    for (const nsp of nsps) {
      const socket = this.nsps[nsp];
      if (socket.active) {
        debug("socket %s is still active, skipping close", nsp);
        return;
      }
    }
    this._close();
  }
  _packet(packet) {
    debug("writing packet %j", packet);
    const encodedPackets = this.encoder.encode(packet);
    for (let i = 0; i < encodedPackets.length; i++) {
      this.engine.write(encodedPackets[i], packet.options);
    }
  }
  cleanup() {
    debug("cleanup");
    this.subs.forEach(subDestroy => subDestroy());
    this.subs.length = 0;
    this.decoder.destroy();
  }
  _close() {
    debug("disconnect");
    this.skipReconnect = true;
    this._reconnecting = false;
    if ("opening" === this._readyState) {
      this.cleanup();
    }
    this.backoff.reset();
    this._readyState = "closed";
    if (this.engine) this.engine.close();
  }
  disconnect() {
    return this._close();
  }
  onclose(reason) {
    debug("onclose");
    this.cleanup();
    this.backoff.reset();
    this._readyState = "closed";
    super.emit("close", reason);
    if (this._reconnection && !this.skipReconnect) {
      this.reconnect();
    }
  }
  reconnect() {
    if (this._reconnecting || this.skipReconnect) return this;
    const self = this;
    if (this.backoff.attempts >= this._reconnectionAttempts) {
      debug("reconnect failed");
      this.backoff.reset();
      super.emit("reconnect_failed");
      this._reconnecting = false;
    } else {
      const delay = this.backoff.duration();
      debug("will wait %dms before reconnect attempt", delay);
      this._reconnecting = true;
      const timer = setTimeout(() => {
        if (self.skipReconnect) return;
        debug("attempting reconnect");
        super.emit("reconnect_attempt", self.backoff.attempts);
        if (self.skipReconnect) return;
        self.open(err => {
          if (err) {
            debug("reconnect attempt error");
            self._reconnecting = false;
            self.reconnect();
            super.emit("reconnect_error", err);
          } else {
            debug("reconnect success");
            self.onreconnect();
          }
        });
      }, delay);
      this.subs.push(function subDestroy() {
        clearTimeout(timer);
      });
    }
  }
  onreconnect() {
    const attempt = this.backoff.attempts;
    this._reconnecting = false;
    this.backoff.reset();
    super.emit("reconnect", attempt);
  }
}
exports.Manager = Manager;
});
unwrapExports(manager);
manager.Manager;

var build = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Socket = exports.io = exports.Manager = exports.protocol = void 0;
Object.defineProperty(exports, "Socket", {
  enumerable: true,
  get: function () {
    return socket$1.Socket;
  }
});
const debug = browser("socket.io-client");
module.exports = exports = lookup;
const cache = exports.managers = {};
function lookup(uri, opts) {
  if (typeof uri === "object") {
    opts = uri;
    uri = undefined;
  }
  opts = opts || {};
  const parsed = url_1.url(uri, opts.path);
  const source = parsed.source;
  const id = parsed.id;
  const path = parsed.path;
  const sameNamespace = cache[id] && path in cache[id]["nsps"];
  const newConnection = opts.forceNew || opts["force new connection"] || false === opts.multiplex || sameNamespace;
  let io;
  if (newConnection) {
    debug("ignoring socket cache for %s", source);
    io = new manager.Manager(source, opts);
  } else {
    if (!cache[id]) {
      debug("new io instance for %s", source);
      cache[id] = new manager.Manager(source, opts);
    }
    io = cache[id];
  }
  if (parsed.query && !opts.query) {
    opts.query = parsed.queryKey;
  }
  return io.socket(parsed.path, opts);
}
exports.io = lookup;
Object.defineProperty(exports, "protocol", {
  enumerable: true,
  get: function () {
    return dist.protocol;
  }
});
exports.connect = lookup;
var manager_2 = manager;
Object.defineProperty(exports, "Manager", {
  enumerable: true,
  get: function () {
    return manager_2.Manager;
  }
});
});
var io = unwrapExports(build);
build.Socket;
build.io;
build.Manager;
build.protocol;
build.managers;
build.connect;

const {
  deepFreeze: deepFreeze$1
} = esm;
const TAG_PREFIX = 'SOCKr';
const EventTypes = deepFreeze$1({
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
const buildParams = (cmd, params) => {
  return [];
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
      params: buildParams()
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

var constants = eventTypes;

export { SocketService, SockrHoc, SockrProvider, WSService, constants as __moduleExports, useSockr, useSockrItems };
//# sourceMappingURL=index.js.map
