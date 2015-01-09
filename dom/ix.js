(function(){
/** 
 * Extended Shortcut list: 
$X(id) = IX.get;
$Xw = IX.win
$XD = IX.Dom;
$XH = IX.HtmlDocument;
$Xc = IX.Cookie;
 */

/**
 * Base DOM related utilities for IX project. All can be called as IX.xxxx(...) anywhere:
 * 
 * IX utilities extended for DOM:
 * 
	isOpera   
	isChrome
	isFirefox
	isSafari
	
	isMSIE
	isMSIE7

	isMSWin
	
	isAndroid
	isAppleHD
	isIPhone
	isIPad
	
	getUrlParam(key, defV) : get value from url query string by key , or return defV if key not exist.
	toAnchor(name) : reset hash for current page;

	bind(el, handlers) : bind event handler on el
	unbind(el, handlers) : remove event handler on el
	
	getComputedStyle(el) : get the computed style after render in browser;
	decodeTXT(txt) : decode from encoded text,
	encodeTXT(txt) : make txt can be shown in document,
	isElement(el) : check if el is valid DOM element
	createDiv(id,clz) : create a div tag under body with id and clz
	get(domEl) : get DOM element by id/el
 * }
 * 
 * IX.win is an utilities for action on window only: {
	bind(handlers)
	unbind (handlerIds)
	scrollTo(x,y)
 * }
 * IX.Xml is a library to deal with XML string or document. It includes: {
	parser(xmlString): it convert xmlString to XML document object and return.
	getXmlString(xmlDocument) : it convert XML document to string and return.
	duplicate(xmlDocument) : it duplicate xml document object and return.
 * }
 *
 * IX.Dom is a library to deal with DOM. It includes :{
	first(node, tagN): try to get the first child of DOM element node which tag name is tagN.
 	next(node, tagN): try to get the first next sibling of DOM element node which tag name is tagN.
	cdata(node, tagN): try to get the text of DOM element node which is involved by CDATA tag.
	text (node, tagN): try to get the text of DOM element node.
	attr (node, attN): try to get the value of attribute of DOM element node which name is attrN.
	setAttr(node, attN, v) : try to set attribute value.
	dataAttr(node, attN) : get the value of attribute "data-{attN}" 
	setDataAttr(node, arrN, v) : similar as setAttr to set value of attribute "data-{attN}" 
 * 		
 	remove(node) : remove node from DOM tree;
 	isAncestor(node, annode) : check if annode is ancestor of node;
 	ancestor(node, tagName) : get first ancestor node of node with tagname;
 	is(el, tagName) : check if el is tagName element
 	
	inTag(tagN, content, attrs) : get html fragment by tagN, content,attrs
	inPureTag(tagN, content, attrs) : similar with inTag, but content is include by CDATA mark
 * }
 *
 * IX.HtmlDocument is an utilities to deal with DOM element by class. It includes : {
	getStyle(node, styleName): get node's style. 
			e.g. $XH.getStyle(node, "border-left-width"), $XH.getStyle(node, "font-size")
	hasClass(el, clzName)
	removeClass(el, clzName)
	addClass(el, clzName)
	toggleClass(el, clzName) : if el has clzName, remove it, otherwise add it;
	next(el, clzName) : get el's first sibling with clzName,
	first(parentEl, clzName) : get parentel, first child node with clzName
	isAncestor(node, pnode) : check if pnode is ancestor of node;
	ancestor(node, clzName) : get first ancestor of node which has clzName
	getWindowScreen() : get current screen status:
			scroll : [scrollX, scrollY, body.scrollWidth, body.scrollHeight],
			size : [body.clientWidth, body.clientHeight]
	getScroll(el) : get el's curre scroll status :
			scrollTop
			scrollLeft
	getZIndex(el) :  get z-index of el
	rect(el, ri) : set el position and area (ri: [left, top, width, height])
	getWindowScrollTop():
	getPosition(el, isFixed) : get position in DOM flow.
		return [left, top, width, height]
 * }	
 *
 * IX.Cookie is used to handle cookie special , it include :{
	get(name),
	set(name, cookie)
	remove(name)
 * }
 * 
 * IX.Util.Event is used to handle DOM event, it include : {
	target(e) :  get event target
	stopPropagation(e) : stop event bubble up;
	preventDefault(e) : stop event default behavior
	stop(e) : make browser not response event.
 * }
 *
 */
var ua = navigator.userAgent.toLowerCase();
function checkUA(keywords){return ua.indexOf(keywords)!=-1;}

var ua = navigator.userAgent.toLowerCase();
var checkUA = function(keywords){
        return ua.indexOf(keywords)>=0;
};
var _isIPad = checkUA('ipad'), _isIPhone = checkUA('iphone');

IX.extend(IX, {
	isOpera : checkUA("opera"),   
	isChrome : checkUA("chrome"),  
	isFirefox : checkUA("firefox") && !checkUA("webkit"),  
	isSafari : window.openDatabase && checkUA("safari") && checkUA('version'),
	
	isMSIE : checkUA("msie") && !checkUA("opera"), 
	isMSIE7 : document.all && checkUA("msie 7.0"),

	isMSWin : checkUA("windows"),
	
	 isAndroid: (checkUA("gecko") && checkUA('safari') && checkUA('mobile') && checkUA('android')),
     isAppleHD: _isIPad || _isIPhone,
     isIPhone: _isIPhone,
     isIPad: _isIPad,
	
	getUrlParam : function(key, defV){
		var v = defV;
		IX.loopbreak(window.location.search.substring(1).split("&"), function(item){
			if(item.indexOf(key+"=")!=0)
				return;
			v = item.substring(key.length+1);
			throw v;
		});
		return v;
	},
	toAnchor : function(name){window.location.hash = "#" + name;}
});

var hasEventListener = ("addEventListener" in window);
var ix_attachEvent = hasEventListener?function(target, eName, fn){
	target.addEventListener(eName, fn, false);
}:function(target, eName, fn){
	target.attachEvent("on" + eName, fn);
};
var ix_detachEvent = hasEventListener?function(target, eName, fn){
	target.removeEventListener(eName, fn, false);
}:function(target, eName, fn){
	target.detachEvent("on" + eName, fn);
};

function EventBindManager(){
	var ht = new IX.I1ToNManager();
	function _evtWrapper(ehKey, evt){
		if (!ht.hasValue(ehKey))
			return;
		var e = evt || window.event;
		if (e && !("target" in e) )
			e.target = e.srcElement; // for IE hack
		IX.iterate(ht.get(ehKey), function(fn){
			IX.isFn(fn) &&  fn(e);
		});
	}
	function _bind(el, evtName, handler){
		var evtKeys = el.data_ixEvtKeys;
		if (!evtKeys)
			evtKeys.id = IX.id();
		var ehKey = evtKeys.id + "." + evtName;
		if (!evtKeys[evtName]) { // never bind!
			evtKeys[evtName] = function(evt){return ht.exec(ehKey, evt);};
			ix_attachEvent(el, evtName, evtKeys[evtName]);
		}
		ht.add(ehKey, handler);
		el.data_ixEvtKeys = evtKeys;
	}
	function _unbind(el, evtName, handler){
		var evtKeys = el.data_ixEvtKeys;
		if (!evtKeys)
			return;
		if (!evtKets[evtName])
			return;
		var ehKey = evtKeys.id + "." + evtName;
		ht.remove(ehKey, handler);
		if (!ht.isEmpty(ehKey)){
			ix_detachEvent(el, evtName, evtKeys[evtName]);
			evtKeys[evtName] = null;
		}
	}
	return {
		exec : _evtWrapper,
		bind : _bind,
		unbind : _unbind
	};
}
var DOM_EventList = [
	"click", "dblclick", "focus", "blur", 
	"keyup", "keydown", 
	"mouseover", "mouseout", "mousedown", "mousemove", "mouseup",
	"resize", "scroll",
	"touchstart", "touchend", "touchmove"
];
var bindMgr = new EventBindManager();
function _bindHandlers(el, handlers, isUnbind){
	if(!el || !handlers) return;
	var bindFn = bindMgr[isUnbind ? "unbind" : "bind"];
	IX.iterate(DOM_EventList, function(evtName){
		if (IX.isFn(handlers[evtName]))
			bindFn(el, evtName, handlers[evtName]);
	});
}
	
IX.extend(IX, {
	bind : function(el, handlers) {_bindHandlers(el, handlers);},		
	unbind : function(el, handlers) {_bindHandlers(el, handlers, true);},
	
	getComputedStyle : "getComputedStyle" in document.defaultView? function(el){
		return document.defaultView.getComputedStyle(el);
	}:function(el){		
		return el.currentStyle || el.style; 
	},
	decodeTXT : function(txt){
		return (txt+"").replaceAll("&nbsp;", ' ').replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
	},
	encodeTXT : function(txt){
		return (txt+"").replaceAll('&', '&amp;').replaceAll("<","&lt;").replaceAll(">", "&gt;").replaceAll(" ", "&nbsp;");
	},
	isElement: function(el){return el.nodeType===1;},
	createDiv : function(id,clz){
		var node = document.createElement('div');
		if (!IX.isEmpty(clz))
			node.className = clz;
		node.id = id;
		document.body.appendChild(node);
		return node;
	},
	get : function(domEl){
		if (IX.isEmpty(domEl))
			return null;
		if (IX.isString(domEl) || IX.isNumber(domEl) )
			return document.getElementById(domEl);
		if ("ownerDocument" in domEl)
			return domEl;
		return null;	
	}
});
window.$X = IX.get;

var winBindMgr = new EventBindManager();
var Win_EventList = ["click", "resize", "scroll" ,"mousedown", "mouseover", "mouseout"];
function _winBindHandlers(handlers, isUnbind){
	if(!handlers) return;
	var bindFn = winBindMgr[isUnbind ? "unbind" : "bind"];
	IX.iterate(Win_EventList, function(evtName){
		if (IX.isFn(handlers[evtName]))
			bindFn(window, evtName, handlers[evtName]);
	});
};
IX.win =  {
	bind : function(handlers){_winBindHandlers(handlers);},
	unbind : function(handlerIds){_winBindHandlers(handlerIds, true);},
	scrollTo : function(x,y){
		window.scrollTo(x, y);
		winBindMgr.exec("scroll", null);
	}	
};
window.$Xw = IX.win;

/**
 * 	IX.Xml is a library to deal with XML string or document. It includes: {
 * 		parser(xmlString): it convert xmlString to XML document object and return.
 * 		getXmlString(xmlDocument) : it convert XML document to string and return.
 *  	duplicate(xmlDocument) : it duplicate xml document object and return.
 * 	}
 */
IX.Xml = {
	parser:function(str){
		str = IX.isString(str)?str:"";
		var doc = null;
		if ("DOMParser" in window) {
			doc = (new DOMParser()).parseFromString(str, "text/xml");
		}else if ("ActiveXObject" in window){
			doc=new ActiveXObject("Microsoft.XMLDOM");
			doc.async="false";
			doc.loadXML(str);
		} else {
			$XE("this browser can't support XML parser.");
		}
		return doc;
	},
	getXmlString:function(xmlDoc){
		if(!xmlDoc==null){
			return "";
		}
		if(IX.nsExisted("document.implementation.createDocument")) {
			return (new XMLSerializer()).serializeToString(xmlDoc);
		}else if ("ActiveXObject" in window){
			return xmlDoc.xml;
		} else {
			$XE("this browser can't support XML parser.");
		}
		return "";
	},
	duplicate:function(xmlDoc){
		return this.parser(this.getXmlString(xmlDoc));
	}
};

/**
 * 	IX.Dom is a library to deal with DOM. It includes :{
 * 		first(node, tagN): try to get the first child of DOM element node which tag name is tagN.
 * 		next(node, tagN): try to get the first next sibling of DOM element node which tag name is tagN.
 * 		cdata(node, tagN): try to get the text of DOM element node which is involved by CDATA tag.
 * 		text (node, tagN): try to get the text of DOM element node.
 * 		attr (node, attN): try to get the value of attribute of DOM element node which name is attrN.
 * 		
 * 		inTag(tagN, content, attrs): 
 * 		inPureTag(tagN, content, attrs): 
 * }
 */
IX.Dom = (function(){
	var loopFn = function(node, type, checkFn, valueFn) {
		if (!node) return valueFn(null);
		var cnode = ("firstChild" in node)?node[type=="first"?"firstChild":"nextSibling"]:null;
		while(cnode!=null && !checkFn(cnode))
			cnode = cnode.nextSibling;
		return valueFn(cnode);
	};
	
	var getFn = function(node, tagN, type){
		return IX.isString(tagN)?loopFn(node, type, function(cnode){
					return cnode.nodeName.toLowerCase()==tagN;
				},function(cnode){
					return cnode;
				}
			):null;
	};
	var textFn = IX.isMSIE?function(node){return node? node.innerText:"";}:function(node){return node?node.textContent:"";};
	
	var cdataFn = function(node){
		if (!node)
			return "";
		return loopFn(node,"first",function(cnode){
				return cnode.nodeType==4;
			},function(cnode){
				return cnode?cnode.nodeValue:"";
			}
		);
	};
	var firstFn = function(node,tagN) {
		return getFn(node,tagN, "first");
	};
		
	var inTagFn = function(tag, content, attrs){//attrs should like [[pramName, paramValue],...
		var _attrs = IX.loop(attrs, [],  function(acc, item){
			return acc.concat(' ', item[0], '="', item[1], '"');
		});
		var arr = [].concat("<", tag, _attrs, ">", content, "</", tag, ">");
		return arr.join("");
	};
	var inPureTagFn = function(tag, content, attrs){
		return inTagFn(tag, ["<![CDATA[", content, "]]>"].join(""),  attrs);
	};
	var attrFn = function(node, attN){
		if(!node)
			return "";
		var val = node.getAttribute(attN);
		return IX.isEmpty(val)?"":val;
	};
	var setAttrFn = function(node, attN, val){
		if(!node)
			return;
		if (val)
			node.setAttribute(attN, val);
		else
			node.removeAttribute(attN);			
	};
	return {
		first:firstFn,
		next:function(node, tagN){
			return getFn(node, tagN,"next");
		},
		cdata:function(node, tagN){
			return cdataFn(firstFn(node, tagN));
		},
		text:function(node, tagN){
			return textFn(firstFn(node, tagN));
		},
		attr:attrFn,
		setAttr:setAttrFn,
		dataAttr :function(node, name){
			return attrFn(node, "data-" + name);
		},
		setDataAttr : function(node, name, val){
			setAttrFn(node, "data-" + name, val);
		},
		remove: function(node){
			if(node)
				if(node.parentNode)
					node.parentNode.removeChild(node);
		},
		isAncestor : function(node, ancestor){
			var el = node;
			while(el){				
				if (el== ancestor)
					return true;
				var nodeName = el.nodeName.toLowerCase();
				el = (nodeName=="body")? null: el.parentNode;
			}
			return false;
		},
		ancestor : function(node, tagName){
			if (!node)
				return null;
			var el =  node;
			while(el){
				var nodeName = el.nodeName.toLowerCase();
				if (nodeName==tagName)
					break;
				el =(nodeName=="body")? null: el.parentNode;
			}
			return el;
		},
		is : function(el, tagName){
			return el.nodeName.toLowerCase() == tagName;
		},
		inTag : inTagFn,
		inPureTag : inPureTagFn
	};
})();
window.$XD = IX.Dom;
/*
*		getStyle(node, styleName): get node's style. e.g. $XD.getStyle(node, "border-left-width"), $XD.getStyle(node, "font-size")
*/
IX.HtmlDocument = (function(){
	var hasFn = function(el, clzName){
		return el!=null && ("className" in el)&& IX.Array.isFound(clzName, (el.className+"").split(" "));
	};
	var removeFn = function(el, clzName){
		if (!el) return;
		var clz = IX.Array.remove(el.className.split(" "), clzName);
		el.className = clz.join(" ");
	};
	var addFn = function(el, clzName) {
		if (!el) return;
		var clzs = IX.Array.toSet(el.className.split(" ").concat(clzName));
		el.className = clzs.join(" ");
	};
	var nextFn = function(node, clzName){
		if (!node)
			return null;
		var el = node.nextSibling;
		while(el){
			if (hasFn(el, clzName))
				return el;
			el = el.nextSibling;
		}
		return el;
	};

	var getStyle = function(_elem,styles){
        var _value=null, elem= IX.get(_elem);
        styles = styles != "float" ? styles : document.defaultView ? "float" : "styleFloat";
        if(styles == "opacity"){
        	if(elem.filters){//IE, two ways to get opacity because two ways to set opacity and must be set opacity before get
        		if(elem.filters.length > 0){
		            try {
		                _value = elem.filters['DXImageTransform.Microsoft.Alpha'].opacity / 100;
		            }catch(e) {
		                try {
		                    _value = elem.filters('alpha').opacity;
		                } catch(err){}
		            }
	        	}else{
	        		_value = "1";
	        	}
        	}else{//w3c
        		_value = elem.style.opacity;
        	}
        }else{
	        _value=elem.style[styles] || elem.style[styles.camelize()];
	        if(!_value){
	             if (document.defaultView && document.defaultView.getComputedStyle) {
	                var _css=document.defaultView.getComputedStyle(elem, null);
	                _value= _css ? _css.getPropertyValue(styles) : null;
	             }else if (elem.currentStyle){
	                _value = elem.currentStyle[styles.camelize()];
	             }
	        }
	        if(_value=="auto" && IX.Array.indexOf(["width","height"], function(_i){return styles == _i;}) > -1 && elem.style.display!="none"){
	            _value=elem["offset"+styles.capitalize()]+"px";
	        }
        }
        return _value=="auto" ? null :_value;
    };
	return {
		getStyle : getStyle,
		hasClass : hasFn,
		removeClass : removeFn,
		addClass : addFn,
		toggleClass : function(el, clzName){
			if (!el) return;
			if (hasFn(el, clzName))
				removeFn(el, clzName);
			else addFn(el, clzName);
		},
		next :nextFn,
		first : function(parentEl, clzName){
			if (!parentEl)
				return null;
			var el = parentEl.firstChild;
			return hasFn(el, clzName)?el: nextFn(el, clzName);
		},
		isAncestor : function(node, pnode) {
			if (!node)
				return false;
			var el =  node;
			while(el!=null){
				if (el==pnode)
					return true;
				el = el.parentNode;
				if (el && el.nodeName.toLowerCase()=="body")
					break;
			}
			return false;
		},
		ancestor : function(node, clzName){
			if (!node)
				return null;
			var el =  node;
			while(el!=null && !hasFn(el, clzName)){
				el = el.parentNode;
				if (el && el.nodeName.toLowerCase()=="body")
					el = null;
			}
			return el;
		},
		
		getWindowScreen : function(){
			var body = document.documentElement;
			var win = window;
			var _scrollX = "scrollX" in win?win.scrollX:body.scrollLeft,
				_scrollY = "scrollX" in win?win.scrollY:body.scrollTop;
			
			return {
				scroll : [_scrollX, _scrollY, body.scrollWidth, body.scrollHeight],
				size : [body.clientWidth, body.clientHeight]
			};
		},
		getScroll: function(_dom){
            if (_dom && _dom.nodeType != 9){//not document
            	return {
                    scrollTop: _dom.scrollTop,
                    scrollLeft: _dom.scrollLeft
                };
            }
            var _window = !_dom ? window : _dom.defaultView || _dom.parentWindow;
            return { scrollTop: _window.pageYOffset
				    || _window.document.documentElement.scrollTop
				    || _window.document.body.scrollTop
				    || 0,
                scrollLeft: _window.pageXOffset
				    || _window.document.documentElement.scrollLeft
				    || _window.document.body.scrollLeft
				    || 0
            };
		},
		getZIndex : function(el) {
			var style = null, zIndex = null;
			while(el && el.tagName.toLowerCase()!="body"){
				style = IX.getComputedStyle(el);				
				if (style.zIndex !="auto")
					return style.zIndex - 0;
				el = el.offsetParent;
			}
			return 0;
		},
		/* ri : [ left, top, width, height] */
		rect : function(el, ri){
			IX.iterate(["left", "top", "width", "height"], function(attr, idx){
				if (ri[idx]!=null)
					el.style[attr] = ri[idx] + "px";
			});
		},
		getWindowScrollTop : function() {
			return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop	|| 0;
		},
		getPosition : function(el, isFixed){
			// getBoundingClientRect : Supported by firefox,chrome,IE8+,opera,safari
			// Return {top, left, right, bottom[, width, height]}
			// width and height are not supported in IE
			// top|left|right|bottom are offset value for visible part of window.
			var rect = el.getBoundingClientRect(),
				doc = document.documentElement || document.body;
			return [
				rect.left + (isFixed ? 0 : window.scrollX || doc.scrollLeft),
				rect.top + (isFixed ? 0 : window.scrollY || doc.scrollTop),
				el.offsetWidth,
				el.offsetHeight
			];
		}
	};	
})();
window.$XH = IX.HtmlDocument;

IX.Cookie = (function(){
	var getOptions = function(options){
		if (!options)
			return [];
		var vals = [];
		if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
			var date;
			if (typeof options.expires == 'number') {
				date = new Date();
				date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
			} else {
				date = options.expires;
			}
			vals.push('; expires=' + date.toUTCString()); // use expires attribute, max-age is not supported by IE
		}
		if ("path" in options)vals.push('; path=' + options.path);
		if ("domain" in options)vals.push('; domain=' + options.domain);
		if ("secure" in options)vals.push('; secure=' + options.secure);
		vals.push(';HttpOnly');
		return vals;
	};
	var _set = function(name, value, options){
		var vals = [name, '=', encodeURIComponent(value)].concat(getOptions(options));
		document.cookie = vals.join('');	
	};
	
	return {
		get : function(name){
			if (IX.isEmpty(document.cookie))
				return "";
			var cookies = document.cookie.split(';');
			for (var i = 0; i < cookies.length; i++) {
				var cookieN = cookies[i].trim();
				// Does this cookie string begin with the name we want?
				if (cookieN.substring(0, name.length + 1) == (name + '='))
					return decodeURIComponent(cookieN.substring(name.length + 1));
	        }
	        return "";
		},
		set : _set,
		remove : function(name){
			_set(name, '', {
				expires: -1
			});
		}
	};
})();
window.$Xc = IX.Cookie;

var eventUtil = {
	target: function(e){
		return e.target||e.srcElement;
	},
	stopPropagation : function(e) {
		//如果提供了事件对象，则这是一个非IE浏览器
		if ( e && e.stopPropagation )
			//因此它支持W3C的stopPropagation()方法
			e.stopPropagation();
		else
			//否则，我们需要使用IE的方式来取消事件冒泡
			window.event.cancelBubble = true;
	},
	preventDefault : function(e) {	//阻止浏览器的默认行为
		//阻止默认浏览器动作(W3C)
		if ( e && e.preventDefault )
			e.preventDefault();
		//IE中阻止函数器默认动作的方式
		else
			window.event.returnValue = false;
		return false;
	},
	stop: function(e){
		eventUtil.preventDefault(e);
		eventUtil.stopPropagation(e);
	}
};
IX.ns("IX.Util");
IX.Util.Event = eventUtil;

})();





