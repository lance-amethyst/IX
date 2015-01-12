var util = require('util');

var x, y, z;
var TD = {
	id  : "123",
	name : undefined,
	title : null,
	content : "",
	bool : false,
	Bool : new Boolean(),
	obj : {a:1, b:2},
	array : [1,2,3],
	func : function(name){return name  + "!!!";}
};

var TestCases = [
["check if IX_DOM_MODE existed?", 
 		"IX_DOM_MODE" in global && IX_DOM_MODE == false],
["check if IXDebug existed?", 
 		"isAllow" in IXDebug && IX.isFn(IXDebug.isAllow) && IX.isFn(debugIsAllow)],
["check if IX.isEmpty works?", 
 		IX.isEmpty(TD.name) && IX.isEmpty(x) && IX.isEmpty(TD.content) && IX.isEmpty(TD.title)],
["check if IX.isUdefined works",
 		IX.isUndefined(x) && IX.isUndefined(TD.name) && IX.isUndefined(TD.noname) 
 		&& !IX.isUndefined(TD.title) && !IX.isUndefined(TD.content)],
["check if IX.isBoolean works",
 		IX.isBoolean(TD.bool) && IX.isBoolean(TD.Bool) && IX.isBoolean("aa"=="bb")],
["check if IX.isObject works",
  		IX.isObject(TD.Bool) && IX.isObject(new Date)],
["check if IX.isString works",
   		IX.isString(TD.content) && IX.isString(TD.id)],

   		
//IX.formatDataStore   
//	IX.wait4(arr, function worker(item, cbFn), function done(err, results);
//	IX.parallel(name, function worker(cbFn)).on(name, function worker(cbFn)).exec(function done(errs, results))
//	IX.sequential(name, function worker(cbFn)).next(name, function worker(cbFn)).exec(function done(errs, results))
// 	IX.sequentialSteps(steps)

];

module.exports = function(){
	//console.log(util.inspect(TestCases));
	TestCases.forEach(function(testcase){
		Assert.apply(null, testcase);
	});
};







