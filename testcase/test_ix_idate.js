var util = require('util');

var  ixarray = IX.Array;

var TestCases = [
//         		toText : similar to IX.Date.format
//        		toWeek : return the day in the week
//        		toDate(includeYear) : return [YYYY年]M月D日,
//        		toTime(ts) : return hh:mm
//        		toShort :return [[YYYY年]M月D日] hh:mm
//        		toInterval(tsInSec) : return simple interval or Today hh:mm or [[YYYY年]M月D日] hh:mm for tsInSec or now,
//        		toSimpleInterval : show interval in simple mode until now,	
];

module.exports = function(){
	//console.log(util.inspect(TestCases));
	TestCases.forEach(function(testcase){
		Assert.apply(null, testcase);
	});
};







