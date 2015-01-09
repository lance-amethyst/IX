(function(){
/**	
 * 	Utilities tool for async jobs
 * 	Date : 2013-9-5 
 *  Author : Lance, GE
 *  Interface :
   		IX.wait4(arr, function worker(item, cbFn), function done(err, results);
   		IX.parallel(name, function worker(cbFn)).on(name, function worker(cbFn)).exec(function done(errs, results))
   		IX.sequential(name, function worker(cbFn)).next(name, function worker(cbFn)).exec(function done(errs, results))
 *  Description:
  		wait4 : any key's worker failed will cause done(err);
  		parallel :done will execute only if all parallel worker finished;
		sequential : done will execute if any step worker failed;
 * 
 */

function checkDone(len, keys, results){
	if (keys.length<len)
		return false;
	for (var i=0;i<len; i++){
		if (!(keys[i] in results)) 
			return false;
	}
	return true;
}

function getLocalLog(type){
	var tips = "Condition." + type + "[" + IX.id() + "]:";
	return function _log(info){
		debugIsAllow("condition") && IX.log(tips + info);
	};
}

/**
 *  workFn: function(key,function(err, data))  		
 *  doneFn : function(err, result);  
 *  
 *  Example:
 *  	condition.wait4(["key1", "key2", ...],  function(key, cbFn, idx){ *  		
 *  		cbFn(error, result4key);
 *  	}, function(err, results){
 *  		//result : {key1 :result1, key2: result2, ...}
 *  	});
 */
IX.wait4 = function(keys, workFn, doneFn){
	var _mylog = getLocalLog("wait");
	var len = keys.length;
	var _results = {}, _keys = [], hasErr = false;
	 
	function workDone(name, err, result){
		if (err || hasErr){
			if (hasErr) return;
			hasErr = true;
			return doneFn(new Error(name+ ":" + err));
		}
		_results[name] = result;			
		if (checkDone(len, _keys, _results)){
			_mylog("done ---------------");
			doneFn(null, _results);
		}
	}	
	keys.forEach(function _worker(key, idx){		
		var name = IX.isString(key)?key : ("t" + idx);
		_keys.push(name);
		_mylog("do : ==============" + name);
		workFn(key, function(err, result){
			_mylog("done : ==============" + name);
			workDone(name, err, result);
		}, idx); 
	});
};

/**
 *  on: 
 *  	params :
 *  		name : 'ssdasd' 
 *  		fn: function(function(err, result))  		
 *  	return {on, exec};
 *  exec
 *  	param 
 *  		doneFn : function(err, result)
 *  
 *  Example:
 *  	condition.parallel("branch1", function(fn){
 *  		fn(err1, result1);
 *  	}).on("branch2", function(fn){
 *  		fn(err2, result2);
 *  	}).exec(function(err, result){
 *  		// err :  {branch1: err1, branch2: err2}
 *  		// result : {branch1: result1, branch2: result2}
 *  	});
 */
IX.parallel = function(_name, _fn){
	var _mylog = getLocalLog("parallel");
	var keys = [], fns = {}, errs = {}, results = {};

	function workDone(name, err, result, doneFn){
		errs[name] = err==null?null:(new Error(name+ ":" + err));
		results[name] = result;
		if (checkDone(keys.length, keys, results)){
			_mylog("done ---------------");
			doneFn(errs, results);
		}
	}
	function execEach(name){
		_mylog("do : ==============" + name);
		fns[name](function(err, result){
			_mylog("done: ==============" + name);
			workDone(name, err, result, doneFn);
		});
	}
	function _exec(doneFn){keys.forEach(execEach);}
	function _on(name, fn){
		if (IX.isFn(fn)) {
			keys.push(name);
			fns[name] = fn;
		}
		return {
			on : _on,
			exec : _exec
		};
	}
	return _on(_name, _fn);
};

/**
 *  next: 
 *  	params :
 *  		name : 'ssdasd' 
 *  		fn: function(function(err, result))  		
 *  	return {next, exec};
 *  exec
 *  	param 
 *  		doneFn : function(err, result)
 *  
 *  Example:
 *  	condition.sequential("step1", function(fn){
 *  		fn(err1, result1);
 *  	}).next("step2", function(fn){
 *  		fn(err2, result2);
 *  	}).exec(function(err, result){
 *  		// err : {stepN : errN}
 *  		// result : {step1: result1, ...stepN-1: resultN-1}
 *  	});
 */

function sequential(_name, _fn){
	var _mylog = getLocalLog("sequential");
	var keys = [], fns = {}, errs = {}, results = {};

	function workDone(name, err, result, doneFn){
		if (err){
			errs[name] = new Error(name + ":" + err);
			return doneFn(errs, results);
		}
		results[name] = result;
		if (0 == keys.length) {
			_mylog("done ---------------");
			doneFn(null, results);
		} else
			doNext(doneFn);
	}
	function doNext(doneFn){
		var name = keys.shift(); 
		_mylog(" : ==============" + name);
		fns[name](function(err, result){
			_mylog("done : ==============" + name);
			workDone(name, err, result, doneFn);
		});
	}
	function _exec(doneFn){
		if (keys.length==0)
			return doneFn({}, {});
		doNext(doneFn);
	}
	function _next(name, fn){
		if (IX.isFn(fn)) {
			keys.push(name);
			fns[name] = fn;
		}
		return {
			next : _next,
			exec : _exec
		};
	}
	return _next(_name, _fn);
}
IX.sequential = sequential;
IX.sequentialSteps = function(steps){
	var cond = sequential("START!", function(fn){fn(null, true);});
	IX.iterate(steps, function(step){
		cond.next(step[0], function(fn){step[1](step[0], fn);});
	});
	return cond;
};
})();