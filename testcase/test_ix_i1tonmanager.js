var util = require('util');

var  ixarray = IX.Array;

var TestCases = [
];

module.exports = function(){
	//console.log(util.inspect(TestCases));
	TestCases.forEach(function(testcase){
		Assert.apply(null, testcase);
	});
};







