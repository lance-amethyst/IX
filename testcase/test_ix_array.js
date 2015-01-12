var util = require('util');

var  ixarray = IX.Array;

var TestCases = [
["check if IX.Array.init works?",
		ixarray.init(3, "a").join("_") == "a_a_a"],
["check if IX.Array.isFound works?", 
 		ixarray.isFound("b", ["a", "B", "c"], function(a,b){return a.toLowerCase() == b.toLowerCase();})],
["check if IX.Array.sort works?", 
		ixarray.sort(["B", "c", "a"], function(a, b){return a.toLowerCase().charCodeAt(0)- b.toLowerCase().charCodeAt(0); }).join("_") == "a_B_c"],
["check if IX.Array.compact works",
 		ixarray.compact(["a", "b", "c" , "a", "b"], function(a){return a != "a";}).join("_") == "b_c_b"],
["check if IX.Array.remove works",
  		ixarray.remove(["a", "b", "c", "a", "b"], "a").join("_") == "b_c_b"],
["check if IX.Array.pushx works",
   		ixarray.pushx(["a", "b"], "c").join("_") == "a_b_c"],
["check if flat works",
 		ixarray.flat([0, [1, 2, [3, [4, 5, [6, 7, [8, 9]]]]]])[9] == 9],
["check indexOf",
 		ixarray.indexOf([0,1,2,3,4,5], function(elem){return elem >3;}) == 4 ],
//[check "splice", ]
["check toSet",
  		ixarray.toSet(["a", "b", "c", "c", "a"]).join("_") == "a_b_c"],
["check isSameSet",
 		ixarray.isSameSet(["a", "b", "c", "a"], ["c", "a", "b", "c"])],
["check merge2Set",
		ixarray.merge2Set("abcaebcdfg".split(""),  "bdefg".split("")).join("_") == "a_b_c_e_d_f_g"]
];

module.exports = function(){
	//console.log(util.inspect(TestCases));
	TestCases.forEach(function(testcase){
		Assert.apply(null, testcase);
	});
};







