"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var React=require("react"),jsutils=require("@keg-hub/jsutils"),io=require("socket.io-client");function _interopDefaultLegacy(e){return e&&"object"==typeof e&&"default"in e?e:{default:e}}var React__default=_interopDefaultLegacy(React),jsutils__default=_interopDefaultLegacy(jsutils),io__default=_interopDefaultLegacy(io);function _defineProperty(obj,key,value){return key in obj?Object.defineProperty(obj,key,{value:value,enumerable:!0,configurable:!0,writable:!0}):obj[key]=value,obj}function _extends(){return(_extends=Object.assign||function(target){for(var i=1;i<arguments.length;i++){var source=arguments[i];for(var key in source)Object.prototype.hasOwnProperty.call(source,key)&&(target[key]=source[key])}return target}).apply(this,arguments)}const SocketContext=React__default.default.createContext(null),useSockr=()=>React.useContext(SocketContext);let _SOCKR_STATE,_SOCKR_DISPATCH=()=>console.warn("Sockr Dispatch has not been initialized!");const getState=()=>_SOCKR_STATE,getDispatch=()=>_SOCKR_DISPATCH,setNextState=next=>{_SOCKR_STATE=next},{deepFreeze:deepFreeze}=jsutils__default.default;var eventTypes={EventTypes:deepFreeze({INIT:"SOCKr:INIT",SET_ID:"SOCKr:SET_ID",CONNECT:"SOCKr:CONNECT",UPDATE_STORE:"SOCKr:UPDATE_STORE",AUTH_TOKEN:"SOCKr:AUTH_TOKEN",NOT_AUTHORIZED:"SOCKr:NOT_AUTHORIZED",ADD_PEER:"SOCKr:ADD_PEER",PEER_DISCONNECT:"SOCKr:PEER_DISCONNECT",SET_CMDS:"SOCKr:SET_CMDS",RUN_CMD:"SOCKr:RUN_CMD",CMD_RUNNING:"SOCKr:CMD_RUNNING",CMD_END:"SOCKr:CMD_END",CMD_OUT:"SOCKr:CMD_OUT",CMD_ERR:"SOCKr:CMD_ERR",CMD_FAIL:"SOCKr:CMD_FAIL"}),tagPrefix:"SOCKr"},eventTypes_1=eventTypes.EventTypes,eventTypes_2=eventTypes.tagPrefix;const setId=({id:id,data:data,isRunning:isRunning})=>{getDispatch()({type:eventTypes_1.SET_ID,id:id,isRunning:isRunning,...data})},setCmds=({data:{commands:commands}})=>getDispatch()({commands:commands,type:eventTypes_1.SET_CMDS});var InternalActions=Object.freeze({__proto__:null,addPeer:({id:id,peers:peers})=>getDispatch()({type:eventTypes_1.ADD_PEER,id:id,peers:peers}),init:(data=jsutils.noOpObj,service=jsutils.noOpObj)=>{setCmds(data),setId(data)},connect:()=>getDispatch()({type:eventTypes_1.CONNECT,connected:!0}),cmdEnd:data=>data&&data.message&&getDispatch()({type:eventTypes_1.CMD_END,...data}),cmdErr:data=>{data&&data.message&&getDispatch()({type:eventTypes_1.CMD_ERR,...data})},cmdFail:(data,service)=>data&&data.message&&getDispatch()({type:eventTypes_1.CMD_FAIL,...data}),cmdOut:data=>{data&&data.message&&getDispatch()({type:eventTypes_1.CMD_OUT,...data})},peerDisconnect:({id:id,peers:peers})=>getDispatch()({type:eventTypes_1.DISCONNECT_PEER,id:id,peers:peers}),setId:setId,setCmds:setCmds,toggleIsRunning:({isRunning:isRunning,name:name})=>{getDispatch()({type:eventTypes_1.RUNNING,isRunning:isRunning,name:name})}});const checkCallEvent=(action,message,instance,event)=>jsutils.checkCall(action,message,instance,event),callAction=(instance,event,action)=>{const eventName=jsutils.camelCase((event.split(":")[1]||"").toLowerCase());return data=>{if(!eventName)return instance.logData("Invalid event name!",event);const message=data&&JSON.parse(data);instance.logEvent(event,message),"init"===eventName&&(instance.commands=jsutils.get(message,"data.commands"));const internal=InternalActions[eventName];internal&&checkCallEvent(internal,message,instance,event);const customEvent=jsutils.get(instance.config,`events.${eventName}`);customEvent&&checkCallEvent(customEvent,message,instance,event);const allEvent=jsutils.get(instance.config,"events.all");allEvent&&checkCallEvent(allEvent,message,instance,event)}};class SocketService{constructor(){_defineProperty(this,"emit",((event,data)=>this.socket?event?(this.logData(`Sending Socket Event: ${event}`,data),void this.socket.emit(event,data)):console.error("Event type is missing, cannot emit socket event without an event type!",event):console.error("Socket not connected, cannot emit socket event!"))),_defineProperty(this,"disconnect",(()=>{if(!this.socket)return this.logData("Socket already disconnected!");this.logData("Disconnecting from Socket!"),this.socket.disconnect(),this.socket=void 0,this.config=void 0,this.dispatch=void 0}))}logData(...data){this.logDebug&&console.log(...data)}logEvent(event,...data){this.logDebug&&console.log(`Socket Event: ${event}`,...data)}initSocket(config,token,logDebug=!1){if(this.socket)return;this.config=config,this.logDebug=logDebug;const endpoint=(config=>{const protocol=jsutils.get(window,"location.protocol","https:");return config.port?`${protocol}//${config.host}:${config.port}`:config.host})(config);this.logData(`Connecting to backend socket => ${endpoint}${config.path}`),this.socket=io__default.default(endpoint,{path:config.path,transports:["websocket","polling","flashsocket"]}),this.addEvents(token)}addEvents(token){this.socket&&(Object.entries(jsutils.get(this.config,"events",jsutils.noOpObj)).map((([name,action])=>{const namCaps=jsutils.snakeCase(name).toUpperCase();if("ALL"===namCaps)return;const eventType=`${eventTypes_2}:${namCaps}`;jsutils.isFunc(action)&&!eventTypes_1[namCaps]&&this.socket.on(eventType,callAction(this,eventType))})),Object.entries(eventTypes_1).map((([key,eventType])=>{this.socket.on(eventType,callAction(this,eventType))})),this.socket.on("connect",this.onConnection.bind(this,token)))}onConnection(token,data){callAction(this,`${eventTypes_2}:CONNECT`)(data)}runCommand(command,params){const{id:id,cmd:cmd,name:name,group:group}=((commands,cmdOrId)=>{const cmdId=jsutils.isObj(cmdOrId)?cmdOrId.id:cmdOrId;return Object.entries(commands).reduce(((found,[group,subCmds])=>found||Object.entries(subCmds).reduce(((subFound,[name,definition])=>!subFound&&jsutils.isObj(definition)&&definition.id===cmdId?definition:subFound),!1)),!1)})(this.commands,command);return this.emit(eventTypes_1.RUN_CMD,{id:id,cmd:cmd,name:name,group:group,params:params})}}const WSService=new SocketService,initialState={connected:!1,peers:[],id:null,runningCmd:null,isRunning:!1,server:jsutils.noOpObj,events:jsutils.noOpObj},sockrReducer=(state=initialState,action)=>{if(!state||!action||!action.type)return state;switch(action.type){case eventTypes_1.CONNECT:return action.connected===state.connected?state:{...state,connected:!0};case eventTypes_1.SET_ID:{const{type:type,...updates}=action;return action.id?{...state,...updates}:state}case eventTypes_1.RUNNING:return action.isRunning===state.isRunning?state:{...state,runningCmd:action.isRunning&&action.name||null,isRunning:action.isRunning};case eventTypes_1.ADD_PEER:case eventTypes_1.DISCONNECT_PEER:return action.peers?{...state,peers:action.peers}:state;default:return state}};let _JOINED_REDUCERS;const initialState$1=sockrReducer();setNextState(initialState$1);const useSockrReducer=(customReducer,customInitialState)=>{const[state,dispatch]=React.useReducer(((sockrReducer,customReducer)=>_JOINED_REDUCERS||(_JOINED_REDUCERS=(state,action)=>{const updatedState=sockrReducer(state,action);return customReducer(updatedState,action)},_JOINED_REDUCERS))(sockrReducer,customReducer),jsutils.deepMerge(initialState$1,customInitialState));return getState()!==state&&setNextState(state),getDispatch()!==dispatch&&(dispatch=>{_SOCKR_DISPATCH=dispatch})(dispatch),state},isDev="development"===process.env.NODE_ENV,MemoChildren=React__default.default.memo((props=>React__default.default.createElement(React__default.default.Fragment,null,props.children)));var constants={...eventTypes};const{EventTypes:EventTypes$1,tagPrefix:tagPrefix}=constants;exports.EventTypes=EventTypes$1,exports.SocketService=SocketService,exports.SockrHoc=Component=>{const websocket=useSockr();return props=>React__default.default.createElement(Component,_extends({},props,{websocket:websocket}))},exports.SockrProvider=props=>{const{children:children,config:config,reducer:reducer,token:token,debug:debug}=props,websocket=useSockrReducer(reducer,config||jsutils.noOpObj);return React.useEffect((()=>(WSService&&!WSService.socket&&WSService.initSocket(websocket,token,debug),()=>!isDev&&WSService.disconnect())),[]),React__default.default.createElement(SocketContext.Provider,{value:websocket},React__default.default.createElement(MemoChildren,null,children))},exports.WSService=WSService,exports.tagPrefix=tagPrefix,exports.useSockr=useSockr,exports.useSockrItems=(findPaths=jsutils.noPropArr)=>{const statePaths=jsutils.eitherArr(findPaths,[findPaths]),state=getState(),values=React.useMemo((()=>statePaths.reduce(((found,valPath)=>(found[valPath]=jsutils.get(state,valPath),found)),{})),[state,statePaths]),sockrRef=React.useRef(values);return React.useMemo((()=>(jsutils.clearObj(sockrRef.current),Object.entries(values).map((([key,value])=>sockrRef.current[key]=value)),sockrRef.current)),[values,sockrRef&&sockrRef.current])};
//# sourceMappingURL=index.js.map
