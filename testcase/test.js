require("../base/ix.js");
require("../base/array.js");
require("../base/condition.js");
require("../base/ds.js");
require("../base/misc.js");
require("../base/tpl.js");
require("../base/task.js");
require("../node/ix.js");

global.Assert = function(msg, bool){
	if (!bool)throw new Error(msg);
};

module.exports = function(){
	["IX", "IX.Array", "IX.Date", "IX.IDate", 
	"IX.State", "IX.IManager", "IX.I1ToNManager", "IX.IListManager",
	"IX.UUID", "IX.IObject", "IX.ITemplate",
	"Extend.prototype"
	].forEach(function(casename){
		//try{
			var filename ="./" + ("test." + casename).replace(/\./g, "_").toLowerCase() + ".js";
			var testcase = require(filename);
			testcase();
			console.log("Test case done : " +  casename);
		//}catch(ex){
		//	console.error("Test case FAIL : " +  casename, ex);
		//}
	});
};












