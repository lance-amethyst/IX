(function() {
/** mark (number) 1000000 as (string) 1,000,000 */
function markUnsignedInt(num){
	var arr = (num + "").split("");
	var l = arr.length, i=l-1;
	if (l<=3)
		return arr.join("");
	var _newArr = [];
	while(i>=0){
		_newArr.unshift(arr[i]);
		if ((l-i)%3 === 0 && i!==0)
			_newArr.unshift(",");
		i--;
	}
	return _newArr.join("");
}

function markNumber(num){
	var arr = (num + "").split(".");
	var sign = arr[0][0]=='-'?"－" : "";
	return sign + markUnsignedInt(arr[0].substring(sign.length)) +
		(arr.length>=2?("." + arr[1]) : "");
}

/* 
	formatNumber(12345.2345, 2) ==> 12,345.23
	formatNumber(-1234567.1, 3) ==> -1,234,567.100
 */ 
function formatNumber(v, len){
	var f = 1 + "0".multi(len) - 0;
	return markNumber(Math.floor(v * f) / f);
}

IX.ns("IX.Math");
IX.Math.markNumber = markNumber;
IX.Math.formatNumber = formatNumber;

/** v: 1.031145 ==> 103.11 */
IX.Math.getPercentage = function (v){
	return formatNumber(v*100, 2);
};

})();