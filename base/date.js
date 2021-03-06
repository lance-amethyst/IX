(function(){
/**
 * IX.Date is a set of utilities for Date to convert to or deconvert to data string. It includes: {
	TicksInHour : constant Number,
	TicksInDay : constant Number,
	UTCDeltaTicks :  constant Number,

  	setDS(v) : set separator between YYYY MM DD, will affect all date utilities;
 	setTS(v) : set separator between hh mm ss, will affect all date utilities;
 	setUTC(bool) : set if using UTC
 	getDS() : get separator between YYYY MM DD
 	getTS() : get separator between hh mm ss
 	isUTC :return if using UTC
 
 	format(date) : return a string like "YYYY-MM-DD hh:mm:ss" for date;
	formatDate(date) : return a string  in "YYYY-MM-DD" for date
	formatTime(date) : return a string  in "hh:mm:ss" for date

 	format4Tag(date) : return a String like "YYYYMMDDhhmmss"
 	formatDate4Tag(date) : return a String like "YYYYMMDD"

 	formatStr(str) :  parse str first, next do similar as format 
 	formatDateStr(str) : similar as formatDate
 	formatTimeStr(str) : similar as formatTime
	
	getDateOfHours(date,numOfHours),
	getDateOfDays(date, numOfDays),
	getDateOfWeeks(date, numOfWeeks),
	getDateOfMonths(date, numOfMonths),
	getDateOfYears(date, numOfYears),

	getDateText(oldTSinMS, curTSinMS) : show interval in simple mode,
	formatBySec(tickInSec, withTime)
	getTickInSec(str)

 	isValid(dateStr, type) :  check if valid type format for dateStr which separated with TS/DS  
 * }
 * 
 * IX.IDate is a Class to deal with Date. It is supplement for Date:
 * 	@Params timeInSecond : the time ticks in second from 1970,1,1
 *	@Methods :{
		toText : similar to IX.Date.format
		toWeek : return the day in the week
		toDate(includeYear) : return [YYYY年]M月D日,
		toTime(ts) : return hh:mm
		toShort :return [[YYYY年]M月D日] hh:mm
		toInterval(tsInSec) : return simple interval or Today hh:mm or [[YYYY年]M月D日] hh:mm for tsInSec or now,
		toSimpleInterval : show interval in simple mode until now,	
 *	};
 */

var Fields4Day = ["FullYear", "Month", "Date"];
var Fields4Time = ["Hours", "Minutes", "Seconds"],
	Fields4Week = ["Hours", "Minutes", "Day"];

var TicksInDay = 86400000, TicksInHour = 3600000, TicksInMinute = 60000;
var FieldLimits4Day = [-1, 12, 31], FieldLimits4Time = [24, 60, 60];
var IntervalUnits = ["刚才", "秒钟前", "分钟前", "小时前", "天前", "周前", "个月前", "年前"];
var IntervalCounts = [0, 10, 60, 3600, 86400, 604800, 2592000, 31536000];
var DT_Weeks = "星期日,星期一,星期二,星期三,星期四,星期五,星期六".split(",");
var DT_KeyWords = {
	Year : "年",
	Month : "月",
	Day : "日",
	Today : "今天"
};

var _isUTC = false;
var ds = "-", ts = ":";

function _getFieldValues(dt, fields){
	var getPrefix = "get" + (_isUTC?"UTC":"");
	return IX.map(fields, function(f){
		return dt[getPrefix + f]();
	});
}
function getFieldValues(dt, fields){
	var getPrefix = "get" + (_isUTC?"UTC":"");
	return IX.map(fields, function(f){
		var v  = dt[getPrefix + f]() + (f=="Month"?1:0);
		var s = "00"+ v;
		return f=="FullYear" ? v : s.substring(s.length-2);
	});
}
function getText4Interval(olderTSInMS, tsInMS) {
	var interval = (tsInMS -olderTSInMS) / 1000 ;
	for (var i = IntervalCounts.length-1; i>=0; i--)
		if (interval >= IntervalCounts[i]){
			var nstr = i===0 ? "" : Math.round(interval / (i==1?1:IntervalCounts[i]));
			return nstr + IntervalUnits[i];
		}
}
function isValidDate(sps, isDate){ // sps: [2012,9, 3] or [13, 30, 0]...
	var limits = isDate ? FieldLimits4Day : FieldLimits4Time;
	return sps.length == 3 && IX.loop(sps, true, function(acc, item, idx){
		if (!acc || isNaN(item) || item.indexOf(".")>=0) return false; // invalid number;
		if (isDate && idx===0) return true; //  will not check year number;
		var n = item * 1 + (isDate ? 0 : 1);
		return n > 0 && n <= limits[idx];
	});
}

function _formatStr(str, sp) {
	if (IX.isEmpty(str))
		return "";
	str = str.split(sp, 3);
	return IX.map(sp==ds?[4,2,2]:[2,2,2], function(item, idx){
		var nstr = (str.length>idx?str[idx]:"");
		return ("0".multi(item) + nstr).substr(nstr.length, item);
	}).join(sp);
}
function _format(date, type) {
	var dateStr = type != "Time" ? getFieldValues(date, Fields4Day).join(ds) : "",
		timeStr = type != "Date" ? getFieldValues(date, Fields4Time).join(ts) : "";
	if (type == "Date") return dateStr;
	else if (type == "Time") return timeStr;
	else return dateStr + " " + timeStr;
}

function getDateOfDays(date, numOfDays){
	var tick = date.getTime();
	return new Date(tick + numOfDays * TicksInDay);
}
function getDateOfMonths(date, numOfMonths){
	var tick = date.getTime();
	var _p1 = tick % TicksInDay, _p2 = (tick - _p1) / TicksInDay;

	var ymd = _getFieldValues(date, Fields4Day);
	var m = ymd[1] + numOfMonths;
	var _y = Math.floor(m /12);
	var _m = m - _y * 12;
	var d = new Date(ymd[0] + _y, _m, ymd[2]);
	tick = d.getTime();
	ymd = _getFieldValues(d, Fields4Day);
	if (ymd[1] != _m)
		tick -= ymd[2] * TicksInDay;

	return new Date(tick + _p1);
}

function isValid(str, isDate){
	return isValidDate(str.split(isDate?ds :ts, 3), isDate);
}
var UTCDeltaTicks = (function(){
	var d = new Date("2000-1-1");
	var tick = d.getTime();
	return tick - (new Date(Math.floor(tick/TicksInDay) * TicksInDay)).getTime();
})();

IX.Date = {
	TicksInMinute : TicksInMinute,
	TicksInHour : TicksInHour,
	TicksInDay : TicksInDay,
	UTCDeltaTicks :  UTCDeltaTicks,

	setDS : function(v){ds = v;},
	setTS : function(v){ts = v;},
	setUTC : function(isUTC){_isUTC= isUTC;}, 
	getDS : function(){return ds;},
	getTS : function(){return ts;},
	isUTC :function(){return _isUTC;},
	// return YYYY-MM-DD hh:mm:ss 
	format : _format,
	// return YYYY-MM-DD
	formatDate : function(date) {return _format(date, "Date");},
	// return hh:mm:ss
	formatTime : function(date) {return _format(date, "Time");},

	// return YYYYMMDDhhmmss
	format4Tag : function(date){
		return getFieldValues(date, Fields4Day.concat(Fields4Time)).join("");
	},
	// return YYYYMMDD
	formatDate4Tag : function(date){
		return getFieldValues(date, Fields4Day).join("");
	},
	// return YYYY-MM-DD hh:mm:ss 
	formatStr:function(str) {
		str = (str + " ").split(" ");
		return _formatStr(str[0], ds) + " " + _formatStr(str[1], ts);
	},
	// return YYYY-MM-DD
	formatDateStr:function(str){return _formatStr(str, ds);},
	// return hh:mm:ss
	formatTimeStr:function(str){return _formatStr(str, ts);},

	getDateOfHours : function(date,numOfHours){
		var tick = date.getTime();
		return new Date(tick - TicksInHour * Math.abs(numOfHours));
	},
	getDateOfDays : function(date, numOfDays){
		return getDateOfDays(date, numOfDays);
	},
	getDateOfWeeks : function(date, numOfWeeks){
		return getDateOfDays(date, numOfWeeks * 7);
	},
	getDateOfMonths : function(date, numOfMonths){
		return getDateOfMonths(date, numOfMonths);
	},
	getDateOfYears :function(date, numOfYears){
		return getDateOfMonths(date, 12 * numOfYears);
	},

	getDateText : getText4Interval,
		
	formatBySec : function(tickInSec, withTime){
		return !tickInSec?"":_format(new Date(tickInSec*1000), withTime?"":"Date");
	},
	//BE Careful : 
	//  new Date("2016-08-30") ==> Tue Aug 30 2016 08:00:00 GMT+0800 (CST)
	//  new Date("2016/08/30") ==> Tue Aug 30 2016 00:00:00 GMT+0800 (CST)	
	getTickInSec : function(str){
		var tickInMS = null;
		if (str && str instanceof Date)
			tickInMS =  str.getTime();
		else if (IX.isString(str) && !IX.isEmpty(str)) {
			var sp = str.replace(/[0-9|:|\ ]/g, '')[0];
			tickInMS = (new Date(str.replaceAll(sp, "-"))).getTime();
		}
		return isNaN(tickInMS) ? null : Math.ceil(tickInMS/1000);
	},

	// accept YYYY-MM-DD hh:mm:ss return true/false;
	isValid : function(dateStr, type) {
		var dt = dateStr.split(" ");
		if (type=="Date" ||type=="Time")
			return dt.length==1 && isValid(dt[0], type == "Date");
		return dt.length==2 && isValid(dt[0], true) && isValid(dt[1], false);
	}
};

IX.IDate = function(timeInSecond) {
	var timeInMS = timeInSecond*1000;
	var date = new Date(timeInMS);
	var dateStr = _format(date);
	var timeValues = getFieldValues(date, [].concat(Fields4Day, Fields4Week, Fields4Time[2]));
	function toDateStr(includeYear){
		var curTime = getFieldValues(new Date(), Fields4Day);
		includeYear = includeYear || (curTime[0]>timeValues[0]);
		return [includeYear?timeValues[0]:"", includeYear?DT_KeyWords.Year:"",
			timeValues[1]-0, DT_KeyWords.Month, 
			timeValues[2]-0, DT_KeyWords.Day].join("");
	}
	function _toIntvText(_date, showToday){
		var curTime = getFieldValues(_date, [].concat(Fields4Day, Fields4Week));
		var strs = [];
		var shouldAppend = false;
		if (timeValues[0] != curTime[0]){
			shouldAppend = true;
			strs = strs.concat(timeValues[0], ds);
		}
		if (shouldAppend || timeValues[1] != curTime[1] || timeValues[2] != curTime[2])
			strs = strs.concat(timeValues[1], ds, timeValues[2], "");
		else if (showToday)
			strs = DT_KeyWords.Today +" ";
		
		strs = strs.concat(timeValues[3], ts, timeValues[4]);
		return strs.join("");
	}
	
	return {
		toText: function(){return dateStr;},
		toWeek : function() {return DT_Weeks[timeValues[5]-0];},
		toDate: toDateStr,
		toTime : function(ds){return [timeValues[3], timeValues[4], timeValues[6]].join(ds || ":");},
		toShort : function(){ return _toIntvText(new Date(), false);},
		toInterval : function(tsInSec){
			var _date = tsInSec?(new Date(tsInSec*1000)) :(new Date());  
			var _tsInMS = _date.getTime();
			if(_tsInMS- timeInMS<TicksInHour) // inner one hour
				return getText4Interval(timeInMS, _tsInMS);
			return _toIntvText(_date, true);
		},
		toSimpleInterval : function(){return getText4Interval(timeInSecond * 1000, IX.getTimeInMS());}
	};
};
})();
