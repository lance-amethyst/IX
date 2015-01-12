var util = require('util');

var  ixarray = IX.Array;

var TestCases = [
//               	setDS(v) : set separator between YYYY MM DD, will affect all date utilities;
//             	setTS(v) : set separator between hh mm ss, will affect all date utilities;
//             	setUTC(bool) : set if using UTC
//             	getDS() : get separator between YYYY MM DD
//             	getTS() : get separator between hh mm ss
//             	isUTC :return if using UTC
//             
//             	format(date) : return a string like "YYYY-MM-DD hh:mm:ss" for date;
//            	formatDate(date) : return a string  in "YYYY-MM-DD" for date
//            	formatTime(date) : return a string  in "hh:mm:ss" for date
//             
//             	formatStr(str) :  parse str first, next do similar as format 
//             	formatDateStr(str) : similar as formatDate
//             	formatTimeStr(str) : similar as formatTime
//            	
//            	getDateText(oldTSinMS, curTSinMS) : show interval in simple mode,
//             	isValid(dateStr, type) :  check if valid type format for dateStr which separated with TS/DS  
];

module.exports = function(){
	//console.log(util.inspect(TestCases));
	TestCases.forEach(function(testcase){
		Assert.apply(null, testcase);
	});
};







