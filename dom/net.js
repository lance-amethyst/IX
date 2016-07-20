(function(){
/**
 * Base NET related utilities for IX project based on DOM. All can be called as IX.xxxx(...) anywhere:
 * 
 * 
 * 
 * IX.Ajax is an lib utitlities for simple ajax request. It always be replaced by jQuery.ajax : {
 * 	request(cfg) : start ajax request. 
  	@params cfg :{
		url : "http://abc.com/request",
		type :  "GET" or "POST",
		contentType : 'application/json' or 'application/x-www-form-urlencoded',
		data : JSON or params ...
		success(data) : when success, it is called.
		fail(data) : ,
		error(data):
	}
	stopAll()
 * }
 * 
 * IX.Net is a library for networking. It includes: {
	loadFile(url, responseHandler): active AJAX requirement and let responseHandler deal with response(Text).
	loadCss(cssUrl): load CSS and  apply to current document.
	loadJsFiles(jsFileUrlArray, postHandler): load all js files in array, and execute postHandler 
			after all jsFiles are loaded.
	tryFn(fnName, argsArray,  dependency): try to execute function fnName with parameters argsArray.
			If the function is not existed, resolve the dependency and try it again.
		@params	dependency:{
			beforeFn: function before applying dependency.
			cssFiles: all required CSS files for current function call.
			jsFiles: all required JS files for current function call.
			afterFn: function after executing current function call.
			delay: the milliseconds for waiting after js files are loaded.
		}
 *	}
 *
 * IX.urlEngine is a utilities to manage URL routines. {
	init(cfg) : to add/update url routine prefix
		@params cfg : {
		  	baseUrl : "https://abc.com/",
		  	[name]Url : "https: //...."
		}
	reset(cfg) : same as init	
	createRouter(routes) : create url routers
		@params routes : [{ 
			name : "page.entry",
			url : can be "/get" or function(params){return "/get";}, url should start with "/"
			urlType : default "base", the url's prefix set by init/reset.
		}]	
		@return : function(name, params){return url;}
 * }
 *
 * IX.ajaxEngine is a utilities to manage AJAX routines. {
	init(cfg) : to add/update ajax routine prefix, 
		@params cfg : {
		  	ajaxFn(ajaxParams) : can be jQuery.ajax, or will use built-in AJAX function.
		  	baseUrl : "https://abc.com/",
		  	[name]Url : "https: //...."
		}
		@sub-params :ajaxParams {
			url : url
			type :  "GET",
			contentType : 'application/json' , ...
			data : jsonData
			success(data) :
			fail(data) :
			error(data):
		}
	reset(cfg) : same as init	
	createCaller(routes) : create ajax routers
		@params routes : [{ 
			name : "signIn",
	 		url : "/session" / function(params){return "/abc";},
			urlType : default "base", the url's prefix set by init/reset.
	 		
	 		channel : used to lock channel to prevent request;
	  		type : "POST"/"GET"/"DELETE" , //default "POST"
	  		preAjax(name, params){return params;}
			postAjax(name, params, cbFn), 
			onsuccess(data,cbFn, params), 
			onfail(data, failFn, params)
		}]	
	 	@return : function(name, params, cbFn, failFn){}
		@sub-params :params {
			...
			_channel_ : assign to temporary channel to prevent duplicate call;
		}
 * };
 */

function createAjaxProxy(){
	if (window.XMLHttpRequest)
		return new window.XMLHttpRequest();
	if (typeof ActiveXObject == "undefined")
		return null;
	// IE
	var xmlhttpObj = ['MSXML2.XMLHTTP.3.0','MSXML2.XMLHTTP','Microsoft.XMLHTTP'];
	for (var i = 0, len = xmlhttpObj.length; i < len; i++) {
		try{
			var proxy =  new window.ActiveXObject(xmlhttpObj[i]);
			if (proxy)
				return proxy;
		}catch(e){}
	}
	return null;
}
var isPhoneGapOnAppleHD = IX.nsExisted("IX.PhoneGap") && IX.isAppleHD;
function ajaxLoading(){
	//Show statusBar network status for iOS
	if (isPhoneGapOnAppleHD)
		window.location="myspecialurl:start";
}
function ajaxLoaded(){
	//Cancel statusBar network status for iOS
	if(isPhoneGapOnAppleHD)
		window.location="myspecialurl:end";
}

var r20 = /%20/g,
	rbracket = /\[\]$/,
	PATTERN_ESCAPED = /["'%\1-\x1f]/g;
function escapeText(text) {
	return (text)? text.replace(PATTERN_ESCAPED, function(c){
		var x=c.charCodeAt(0); return (x<16? "%0": "%")+x.toString(16); 
	}) : "";
}
function ajaxParam(a, traditional) {//traditional : 规定是否使用传统的方式浅层次的进行序列化（参数序列化），默认为 false(深层次)
	if (typeof(a) === 'string') {//处理JSON Params
		return escapeText(a);
	} else {
		var s = [],
		add = function( key, value ) {
			if(IX.isFn( value )) return;
			s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
		};
		if ( traditional === undefined )
			traditional = false;
		if ( IX.isArray( a ) || ( !IX.isObject( a ) ) ) {
			IX.each( a, [],function(acc, value, name, idx) {
				if (!a.hasOwnProperty || a.hasOwnProperty(name))
					add( name, value );
			} );
		} else {
			for ( var prefix in a )
				buildAjaxParams( prefix, a[ prefix ], traditional, add );
		}
		return s.join( "&" ).replace( r20, "+" );
	}
}
function buildAjaxParams( prefix, obj, traditional, add ) {
	if ( IX.isArray( obj ) && obj.length ) {
		IX.each( obj, [],function(acc, v, name, i) {
			if ( traditional || rbracket.test( prefix ) )
				add( prefix, v );
			else
				buildAjaxParams( prefix + "[" + ( typeof v === "object" || IX.isArray(v) ? i : "" ) + "]", v, traditional, add );
		});
	} else if ( !traditional && obj !== null && typeof obj === "object" ) {
		if ( IX.isArray( obj ) || IX.isEmpty( obj ) )
			add( prefix, "" );
		else {
			for ( var name in obj )
				buildAjaxParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}
	} else
		add( prefix, obj );
}

var ajaxHT = new IX.IListManager();
function ajaxProxyStateChange(proxy, callback, failCbFn){
	var timer = proxy.timer;
	if (proxy.readyState == 4) {
		if(proxy.status == 200){
			if (debugIsAllow('ajax'))
				IX.log("ajaxProxyStateChange: "+ proxy.status + " " + proxy.responseText);
			clearTimeout(timer);
			proxy.timer = null;
			callback(proxy.responseText, proxy);
		}else{
			if (timer)
				clearTimeout(timer);
			failCbFn({
				retCode: 0,
				err : "AJAX fail",
				ajaxStatus: proxy.status
				//isTimeout: false
			}, proxy);
		}
	}
	ajaxHT.remove(proxy.id);
	proxy = null;
	ajaxLoaded();
}

var DefaultAjaxContentType = "application/x-www-form-urlencoded";
var ajaxArray = [];
function ajaxCall(cfg){
	var type = cfg.type || "GET";
	var failFn =  $XF(cfg, "fail");
	var params = ajaxParam(cfg.data);
	var url = cfg.url;
	if(type == "GET")
		url = url + "?" + params;
	
	var proxy = createAjaxProxy();
	if(!proxy){
		IX.err("unsupport AJAX. Failed");
		return failFn({
			retCode : 0,
			err: "unsupport AJAX. Failed"
		});
	}

	ajaxArray.push(proxy);
	proxy.timer = setTimeout(function(){
		failFn({
			retCode: 0,
			err: "timeout AJAX. Failed",
			isTimeout: true
		});	    
	}, 60000);
	proxy.onreadystatechange = function(){
		ajaxProxyStateChange(proxy, $XF(cfg, "success"), failFn);
	};

	try{
		proxy.open(type, url, "async" in cfg ? cfg.async : true);
		IX.each(cfg.headers || {}, {}, function(acc, value, key){
			proxy.setRequestHeader(key, value);
			return acc;
		});
		proxy.setRequestHeader("Content-type", $XP(cfg, "contentType", DefaultAjaxContentType));
		proxy.send(params);
		
		proxy.id = IX.id();
		ajaxHT.register(proxy.id, proxy);
		ajaxLoading();
	}catch(ex){
		failFn({
			retCode : 0,
			err:ex.message
		});
		ajaxLoaded();
	}
}

IX.Ajax = {
	request : function(cfg){
		ajaxCall({
			url: cfg.url,
			type: cfg.type,
			contentType : cfg.contentType || null,
			headers : IX.inherit({
				"Accept": "application/json"
			}, cfg.headers),
			data: cfg.data,
			fail : cfg.fail,
			success: function(responseTxt) {
				var succFn = $XF(cfg.success);
				try{
					succFn(JSON.parse(responseTxt));
				}catch(e) {
					succFn({
						retCode : 1,
						text : responseTxt
					});
				}
			}
		});
	},
	stopAll :function(){
		ajaxHT.iterate(ajaxArray, function(proxy){
			proxy.abort();
			ajaxHT.remove(proxy.id);
			proxy = null;
		});
		ajaxHT.clear();
		ajaxArray = []; 
	}
};

function loadFn(durl, cbFun){
	ajaxCall({
		url: durl,
		type: "GET",
		success: cbFun
	});
}
function _afterLoadJsFn(script, nextFn){
	if (!script.readyState){
		 script.onload= nextFn;
		 return;
	}
	// IE
	script.onreadystatechange= function () {
		if (debugIsAllow('net'))
			IX.log("STATE: [" +script.src +"]:" +  this.readyState);
		if (script.readyState == 'complete' || script.readyState == 'loaded') {
			script.onreadystatechange = null;
			nextFn();
		}
	};
}
var _head= document.getElementsByTagName('head')[0];
function loadJsFn(durl, nextFn){
	var script= document.createElement('script');
	script.type= 'text/javascript';
	script.src= durl;
	if (IX.isFn(nextFn))
		_afterLoadJsFn(script, nextFn);
	_head.appendChild(script);
}
function loadJsFilesInSeqFn(jsFiles, nextFn){
	var _nextFn = IX.isFn(nextFn)?nextFn:IX.emptyFn;
	if (!jsFiles || jsFiles.length===0)
		return _nextFn();
	var n = jsFiles.length;
	var idx =0;
	var fn = function(){
		loadJsFn(jsFiles[idx], function(){
			idx +=1;
			return (idx<n)?fn():_nextFn();
		});
	};
	fn();
}
function loadCssFn(cssFile){
	var cssNode = document.createElement('link');
	cssNode.type = 'text/css';
	cssNode.rel = 'stylesheet';
	cssNode.href = cssFile;
	cssNode.media = 'screen';
	_head.appendChild(cssNode);
}
function tryExecute(fnName, argList, dependencyConfig){
	var fn = function(){				
		IX.execute(fnName, argList);
		IX.tryFn(dependencyConfig.afterFn);
	};
	if (IX.nsExisted(fnName))
		return fn();
	if (!dependencyConfig){
		return;
	}
	var config = dependencyConfig;
	IX.tryFn(config.beforeFn);
	IX.iterate(config.cssFiles, loadCssFn);
	var delay = config.delay || 100;
	loadJsFilesInSeqFn(config.jsFiles, function(){
		setTimeout(fn, delay);
	});
}

IX.Net = {
	loadFile:loadFn,
	loadCss:loadCssFn,
	loadJsFiles:function(jsFiles, nextFun, mode){
		//if (!mode || mode=="seq" ){
			loadJsFilesInSeqFn(jsFiles, nextFun);
		//}
	},
	tryFn:tryExecute
};

// IX.ajaxEngine && IX.urlEngine
function defaultParamFn(_name, _params){return _params;}
function defaulRspFn(data, cbFn){if (IX.isFn(cbFn)) cbFn(data);}
function getFunProp(_cfg, _name, defFn){
	var _fn = $XP(_cfg, _name);
	return IX.isFn(_fn)?_fn :defFn;
}

function urlRouteFn(routeDef, ifAjax){
	var _url = $XP(routeDef, "url");
	if (IX.isEmpty(_url))
		return null;
	var route = ifAjax ? {
		channel : $XP(routeDef, "channel"),
		type : $XP(routeDef, "type", "POST"),
		dataType : $XP(routeDef, "dataType", "form"),
		onsuccess : getFunProp(routeDef, "onsuccess", defaulRspFn),
		preAjax : getFunProp(routeDef, "preAjax", defaultParamFn),
		postAjax : $XF(routeDef, "postAjax"),
		onfail : getFunProp(routeDef, "onfail", defaulRspFn)
	} : {};
	route.url = _url;
	route.urlType = $XP(routeDef, "urlType", "base") + "Url";	
	return route;	
}
function createRouteHT(routes, ifAjax){
	return IX.loop(routes, {}, function(acc, routeDef){
		var _name = $XP(routeDef, "name");
		if (IX.isEmpty(_name))
			return acc;
		var route = urlRouteFn(routeDef, ifAjax);
		if (route)
			acc [_name] = route;
		return acc;
	});
}

var urlFac = (function UrlFactory(){
	var _urls = {};
	function genUrl(_route, params){
		if (!_route)
			return "";
		var url = _route.url;
		var _url = IX.isFn(url)?url(params):url.replaceByParams(params);
		var _urlBase = (_route.urlType in _urls)?_urls[_route.urlType] : _urls.baseUrl;
		return _urlBase + _url;
	}
	function clean4Url(_route, params){
		if (!_route)
			return params;
		var url = _route.url;
		return (IX.isFn(url)) ? params : url.filterParams(params);
	}
	return {
		init : function(cfg){_urls = IX.inherit(_urls, cfg);},
		genUrl : genUrl,
		clean4Url : clean4Url
	};
})();

function createUrlRouter(routes){
	var _routeHT = createRouteHT(routes);
	return function(_name, params){
		return urlFac.genUrl(_routeHT[_name], params);
	};
}

function tryLockChannel(channel){
	if (IX.isEmpty(channel))
		return true;
	var id = "ajaxChannel_" + channel;
	if ($X(id))
		return false;
	IX.createDiv(id, "ajax-channel");
	if (debugIsAllow("channel"))
		IX.log ("lock channel: " + channel);
	return true;
}
function unlockChannel(channel){
	if (IX.isEmpty(channel))
		return;
	var el = $X("ajaxChannel_" + channel);
	if (el)
		el.parentNode.removeChild(el);
	if (debugIsAllow("channel"))
		IX.log ("unlock channel: " + channel);
}
function tryJSONParse(data){
	if (IX.isString(data))
		try{return JSON.parse(data);}catch(e){}
	return data;
}
function executeCaller(_caller, _ajaxFn, _name, params, cbFn, failFn){
	var _cbFn = IX.isFn(cbFn) ? cbFn : IX.emptyFn;
	function deliveryResult(_data){
		if (!_checkResultFn(_data))
			_caller.onfail(_data, failFn, params, {
				name : _name,
				success : cbFn,
				fail :failFn
			});
		else
			_caller.onsuccess(_data, _cbFn, params, {
				name : _name,
				success : cbFn,
				fail :failFn
			});
	}

	var channel = $XP(params, "_channel_", _caller.channel);
	if (!tryLockChannel(channel))
		return deliveryResult({
			retCode : 0,
			err : "channel in using:"+ channel
		});
	var isJson = _caller.dataType == 'json';
	var _data = _caller.preAjax(_name, params);
	var _url = urlFac.genUrl(_caller, _data);
	_data = urlFac.clean4Url(_caller, _data);
	_url += (_url.indexOf("?")>0?"&_t=":"?_t=") +  IX.getTimeInMS();

	_ajaxFn({
		url : _url,
		type :  _caller.type,
		contentType : isJson ? 'application/json' : 'application/x-www-form-urlencoded',
		data : isJson && _caller.type != "GET" ? JSON.stringify(_data) : _data,
		success : function(data) {
			unlockChannel(channel);
			deliveryResult(tryJSONParse(data));
		},
		fail: function(data){
			unlockChannel(channel);
			deliveryResult(IX.inherit({retCode: 0}, tryJSONParse(data)));
		},
		error: function(data, errMsg, error){
			unlockChannel(channel);
			//console.error(error);
			deliveryResult({
				retCode : -2,
				err : IX.isString(error) ? error : error.message
			});
		}
	});
	_caller.postAjax(_name, params, _cbFn);
}

var _ajaxEngineFn = null;
var _checkResultFn = function(data){
	return data.retCode==1;
};
function initAjaxEngine(cfg){
	if (cfg && IX.isFn(cfg.ajaxFn))
		_ajaxEngineFn = cfg.ajaxFn;
	if (cfg && IX.isFn(cfg.checkResultFn))
		_checkResultFn = cfg.checkResultFn;
	urlFac.init(cfg);
}
function createAjaxCaller(routes){
	var _callerHT = createRouteHT(routes, true);
	return function(_name, params, cbFn, failFn){
		var _caller = _callerHT[_name];
		if (!_caller || !IX.isFn(_ajaxEngineFn))
			return;
		executeCaller(_caller, _ajaxEngineFn, _name, params, cbFn, failFn);
	};
}

IX.urlEngine = {
	init : urlFac.init,
	reset : urlFac.init,	
	createRouter : createUrlRouter	
};
IX.ajaxEngine ={
	init : initAjaxEngine,
	reset : initAjaxEngine,
	createCaller: createAjaxCaller
};

})();