(function(){
/**  
 * IX constant can be access anywhere;
 * 		IX_SCRIPT_PATH
 */

/**
 * IX.Util.Image is an utilities to deal with image data. It only support on HTML5 browsers:
 	getData(imgEl, cfg): 
 		cfg : {width, height}
	  	return : {url, w, h, data}
	setData(imgEl, imgData, keepRatio)
 * };
 */
function _getImageDataUrl(img,cw,ch, w, h){
	var canvas = document.createElement("canvas");
	canvas.width = cw;  
	canvas.height = ch;
	var ctx = canvas.getContext("2d");
	ctx.drawImage(img, (cw-w)/2, (ch-h)/2, w, h);
	var dataURL = canvas.toDataURL("image/png");
	delete canvas;
	return dataURL;
}
function getRatioWH(w, h, rw, rh){
	var wratio = w/rw, hratio = h/rh;
	if (wratio>=1 && hratio>=1)
		return [rw, rh];
	wratio = Math.min(wratio, hratio);
	return [rw * wratio, rh *wratio];		
};

function getImageData(imgEl, cfg){
	if (!imgEl)
		return null;
	var img = new Image();
	img.src = imgEl.src;
	var wh =getRatioWH($XP(cfg, "width", img.width), $XP(cfg, "height", img.height), img.width, img.height);
	if (wh[0] * wh[1] == 0)
		return null;
	var dataURL = _getImageDataUrl(img, wh[0], wh[1], wh[0], wh[1]);
	delete img;
	return {
		url : imgEl.src,
		w: wh[0], 
		h: wh[1],
		data : dataURL
	};
};
function setImageData(imgEl, imgData, keepRatio){
	if (!imgEl)
		return;
	var img = new Image();
	img.src = imgData.data;
	var cwEl = keepRatio?imgEl:img;
	var wh =getRatioWH(cwEl.width, cwEl.height, img.width, img.height);
	var dataURL = _getImageDataUrl(img,cwEl.width, cwEl.height, wh[0], wh[1]);
	delete img;
	imgEl.src = dataURL;
};
IX.ns("IX.Util");
IX.Util.Image =  {
	getData : getImageData,
	setData : setImageData
};

var getIXScriptEl = function(){
	if ("scripts" in document) {
		var scripts =document.scripts;
		for(var i=0; i<scripts.length; i++) {
			if (scripts[i].src.indexOf(IX_SCRIPT_NAME)>=0)
				return scripts[i];
		}
	}
	var head = $XD.first(document.documentElement, "head");
	var ixEl = $XD.first(head, "script");
	while(ixEl){
		if (ixEl.src.indexOf(IX_SCRIPT_NAME)>=0)
			break;			
		ixEl = $XD.next(ixEl, "script");
	}
	return ixEl;
};

var ixEl = getIXScriptEl();
var path = ixEl?ixEl.src:"";
window.IX_SCRIPT_PATH = path.substring(0, path.indexOf(IX_SCRIPT_NAME)); 
})();
