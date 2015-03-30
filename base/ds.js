(function(){
/**
 * IX.State is simple state-machine utilities:{
	toggle(origStat, newStat) : if newStat give, return newStat, otherwise return !origStat
 * }
 *
 * IX.IManager is a Class to deal with key/value safely. It provide:
 * @Methods :{
	isRegistered(key) : check if key exist;
	register(key, value) : set the key mapped to value
	unregister(key) : clear the key's value
	get(key) : get the value mapped by key,
	clear() : clear all key/value;
 * }
 *
 * IX.IList is a Class to deal with Array easily. It provide:
 * @Methods : {
	isEmpty() : check if list is empty
	isLast(k) : check if k is last element in list
	getList() : return whole list
	getSize() : return the length of list
	indexOf(key) : return the index of key in list
	remove(idx) : remove the element in list idx position
	tryRemove(key): try remove key from list if existed
	append(key) : remove existed key and append key to last position in list
	tryAdd(key) : append key only if it is inexisted in list
	insertBefore(key, dstKey) : remove key if existed and insert it before dstkey, or append it if dstKey not existed
	clear() : clean all list
 * }
 * 
 * IX.I1ToNManager is a Class to deal with special key/value which one key mapped to many values. It provide:
 * @Methods : {
  	@Methods(IX.IManager)
  	
	hasValue(key) : check if any value is mapped by key
	put(k, v) : map k to v
	remove(k, v) : unmap v by k
 * }
 * 
 * IX.IListManager will manage key/value store with ordered key list. It provide:
 * @Methods : {
  	@Methods(IX.IManager)
  	
  	register(key, value) : @Override append the key to the last of list 
	unregister(key) :  @Override remove the entry for key from store
	isEmpty() : check if store is empty
	getSize() : get the size of store
	hasKey(key) : check if key is in store
	isLastKey(key) : check if key is the last in store
	getKeys() : get all key in sequence in store
	getByKeys(keys) :  get all values mapped by keys
	getAll() : get all values in store
	iterate(fn) :  for each value, iterate to execure fn(value, key)
	getFirst() : get the first meaningful value

	append(key) :  only append key to store's key list, will not changed value
	insertBefore(key, dstKey) : only for key, same as IX.IList.insertBefore,
	remove(key) : same as unregister, remove entry and value by key.
	clear() : clear the store
 * }
 * 
 * IX.IPagedManager will manage key/value store with ordered key list in paged info.
 * params :
	newInstFn : function(item){return itemModel;} // to create model for item
	instHT : null or instance of IX.IListManager  // if null, will create HT of IListManager
	dataCaller : function({pageNo, pageSize}, cbFn({total, items: [item]})) // dynamic load data for paged data
 * @Methods : {
	get : function(id){return itemModel;},
	getFirst : function(){return firstItemModel;},
	// getSize : function(){return sizeInHT;},
	getTotal : function(){return total;},

	load : load(pageNo, pageSize, cbFn([itemModel]), lazyLoad)
	putData : function({total, items}, startPos),
	addItems : function(itemIds){} // only change total and clear page info;
	removeItems : function(itemIds){}, // remove itemModels in HT, change total and clear page info;
	// iterate : function(fn), // iterate all itemModels in HT,
	clear : function(){ids = [];} // clear page info;
 * }
 *
 * IX.formatDataStore is an utilities handle with JSON data , for example
 * if convert JSON like :
 *  {
  		type : "array"/"json", [option; default :"json"]
 *		1: for array:
  		fields :["name1", "name2", ...],
  		items:[ [value1, value2, ...], ...]
 * 		2: for json:
  		items : [{name1: value1, name2: value2},...]
 *  } to Array like :
 *  [{name1: value1, name2: value2},...]
 * 
 */
IX.State = {
	toggle :function(origStat, newStat){
		return (newStat===undefined)?!origStat : newStat;
	}
};

IX.IManager = function(){
	var _ht = {};
	return {
		isRegistered : function(name){
			return (name in _ht) && (_ht[name]);
		},
		register: function(name, obj) {
			_ht[name] = obj;
		},
		unregister : function(name){
			_ht[name] = null;
		},
		get: function(name){
			return (name in _ht)?_ht[name]: null;
		},
		clear : function() {
			_ht = {};
		}
	};
};

var _IXArrayIndexOf =  IX.Array.indexOf;
IX.IList = function(){
	var _keyList = [];

	function indexOfFn(key) {
		return key ? _IXArrayIndexOf(_keyList, function(item) {
			return item == key;
		}) : -1;
	}
	function removeFn(idx) {
		if (idx >= 0 && idx<_keyList.length)
			_keyList = _keyList.slice(0, idx).concat(_keyList.slice(idx+1));
	}
	function appendFn(key){
		if (!_keyList || _keyList.length === 0)
			_keyList = [key];
		else {
			var idx = indexOfFn(key);
			removeFn(idx);
			_keyList.push(key);
		}
	}
	function insertBefore(key, dstKey) {
		// find the dstKey, if not exist, append current key to the end of list.
		var dstIdx = indexOfFn(dstKey);
		if (dstIdx == -1) {
			appendFn(key);
			return;
		}
		// find the key, if current key is before dstKey, do nothing.
		var idx = indexOfFn(key);
		if (idx != -1 && dstIdx - idx == 1)
			return;
		// else remove the existed record and insert it before dstKey.
		if (idx >= 0) {
			removeFn(idx);
			dstIdx = indexOfFn(dstKey);
		}
		_keyList = _keyList.slice(0, dstIdx).concat([key], _keyList.slice(idx));
	}
	return {
		isEmpty :function(){return _keyList.length===0;},
		isLast : function(k){return _keyList.length>0 && k==_keyList[_keyList.length-1];},
		getList : function(){return _keyList;},
		getSize: function(){return _keyList.length;},
		indexOf : indexOfFn,
		remove : removeFn,
		tryRemove : function(key){removeFn(indexOfFn(key));},
		append : appendFn,
		tryAdd :function(key){
			if (!_keyList || _keyList.length === 0)
				_keyList = [key];
			else if (indexOfFn(key) <0)
				_keyList.push(key);
		},
		insertBefore : insertBefore,
		clear : function(){
			_keyList = [];
		}
	};
};
IX.I1ToNManager = function(eqFn) {
	var _eqFn = IX.isFn(eqFn)?eqFn : function(item, value){return item==value;};
	var _mgr = new IX.IManager();

	var hasEntryFn = function(key) {
		var list = _mgr.get(key);
		return list && list.length>0;
	};
	var indexOfFn = function(arr, value) {
		return _IXArrayIndexOf(arr, function(item){return _eqFn(item, value);});
	};

	return IX.inherit(_mgr, {
		hasValue :hasEntryFn,
		put : function(k, v) {
			if (!hasEntryFn(k)) {
				_mgr.register(k, [v]);
				return;
			}
			var list = _mgr.get(k);
			if (indexOfFn(list, v)==-1)
				_mgr.register(k, list.concat(v));
		},
		remove : function(k, v){
			var list = _mgr.get(k);
			var idx = indexOfFn(list, v);
			if (idx >= 0)
				_mgr.register(k, IX.Array.splice(list, idx));
		}
	});
};
IX.IListManager = function() {
	var _super = new IX.IManager();
	var _list = new IX.IList();

	var registerFn = function(key, obj) {
		_super.register(key, obj);
		var idx = _list.indexOf(key);
		if (obj) {
			if (idx == -1)
				_list.append(key);
		} else 
			_list.remove(idx);
	};
	var listFn = function(keys) {
		return IX.map(keys, function(item) {return _super.get(item);});
	};
	return IX.inherit(_super, {
		// register should not change the sequence of key.
		register : registerFn,
		unregister : function(key){registerFn(key);},
		isEmpty :function(){return _list.isEmpty();},
		getSize : function(){return _list.getSize();},
		hasKey : _super.isRegistered,
		isLastKey : function(key){return _list.isLast(key);},
		getKeys : function() {return _list.getList();},
		getByKeys : function(keys){return listFn(keys);},
		getAll : function() {return listFn(_list.getList());},
		iterate: function(fn){IX.iterate(_list.getList(), function(item){fn(_super.get(item), item);}); },
		getFirst : function() {
			var arr = _list.getList();
			if (!arr || arr.length === 0)
				return null;
			var len = arr.length;
			for (var i = 0; i < len; i++) {
				var inst = _super.get(arr[i]);
				if (inst)
					return inst;
			}
			return null;
		},
		// only for key. append will remove existed record in keyList and append it to the end
		append : _list.append,
		insertBefore : _list.insertBefore,
		remove : function(key) {registerFn(key);},

		clear : function(){
			_super.clear();
			_list.clear();
		}
	});
};

IX.IPagedManager = function(newInstFn, instHT, dataCaller){
	var total = null;
	var ids = [];
	var ht = instHT ? instHT :(new IX.IListManager());

	function _add(pos, item){
		var model = newInstFn(item);
		var id = model.getId();
		ids[pos] = id;
		ht.register(id, model);
		return model;
	}
	function putData(data , startPos){
		if ("total" in data)
			 total = data.total;
		var pos = startPos || 0;
		return IX.map(data.items, function(item, idx){
			return _add(pos + idx, item);
		});
	}
	function load(pageNo, pageSize, cbFn, lazyLoad){
		var startPos = pageNo * pageSize;
		if (lazyLoad){
			var _ids = [];
			var _num = total === null? 0 : Math.min(pageSize, total - startPos);
			for(var i=0; i<_num; i++) {
				var id = ids[startPos + i];
				if (IX.isEmpty(id)) break;
				_ids.push(id);
			}
			if (_num > 0 && _ids.length == _num)
				return cbFn(ht.getByKeys(_ids));
		}
		dataCaller({
			pageNo : pageNo,
			pageSize : pageSize
		}, function(result) {
			cbFn(putData(result, startPos));
		});
	}
	function resetTotal(_total){
		total = _total;
		ids = [];
	}
	return {
		get : ht.get,
		getFirst : ht.getFirst,
		//getSize : ht.getSize,
		getTotal : function(){return total;},

		load : load,
		putData : putData,
		addItems : function(itemIds){
			resetTotal(total + itemIds.length);
		},
		removeItems : function(itemIds){
			IX.iterate(itemIds, function(itemId){
				ht.unregister(itemId);
			});
			resetTotal(total - itemIds.length);
		},
		//iterate : ht.iterate,

		clear : function(){ids = [];}
	};
};

IX.formatDataStore = function(data){
	var _items = $XP(data, "items", []);
	if (_items.length>0 && $XP(data, "type", "json")!="json"){
		var _fields = $XP(data, "fields", []);
		_items =  IX.map(_items, function(row){
			return IX.loop(_fields, {}, function(acc, col, idx){
				acc[col] = IX.isArray(row)?row[idx]:row[col];
				return acc;
			});
		});
	}
	
	return IX.map(_items, function(item){
		var id = $XP(item, "id");
		if (IX.isEmpty(id))
			item.id = IX.id();
		return item;
	});
};
})();
