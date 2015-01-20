/**
 * IX utilities extended for node.js;
 * @processOwner should be global variable which show the process and its files owner
 * 
 * File Utilities:
 	safeMkdirSync(path) : create folder for path
 	saveFileIfNotExist(path, name, data, cbFn) : save data only if path/name not existed.
	safeChkPath(filePath, filename) : make sure filePath existed 
			and return "~/+" before path "filePath/filename" to mark if file existed or not, 
	safeChkFile(filePath, filename) : similar as safeChkFile but return null if file not existed. 
	safeRenameAs(oldFilename, filePath, filename) : check if filePath/filename existed, 
			if yes, remove oldFilename only; else rename it to new path.
	safeCopyTo(srcFile, filePath, filename) :check if filePath/filename existed, 
			if yes, do noting; else copy it to new path.
 *
 * Error/Log Utilities:
	setLogPath(path) : reset the log file output path, for example: 
			if path is "/tmp/ix", the log/err file should be "/tmp/ix.log"/"tmp/ix.err"
	err(errMsg) : output to *.err file
	log(errMsg) : output to *.log file
 *}
 */
var fs = require('fs');
var path = require('path');
var util = require('util');
var childProcess = require('child_process');

function chownFileOwner(filePath){
	if (global.processOwner)
		childProcess.exec("chown -R " + global.processOwner  + " " + filePath);
}
function _safeMkdirSync(_path){
	var dirs = _path.split("/"), currentDir = "";
	dirs.shift();
	try {
		dirs.forEach(function(dir){
			currentDir = currentDir + "/"  + dir;
			if (!fs.existsSync(currentDir))		
				fs.mkdirSync(currentDir, 0755);
		});
	}catch(ex){
		console.error("Exception as mkdir :" + currentDir + "::" +  ex);
	}
}
function saveFileIfNotExist(filePath, filename, fileData, cbFn){
	var fileName = filePath + "/" +filename;	
	if (fs.existsSync(fileName))
		return cbFn(new Error("File existed: " + fileName));

	if (!fs.existsSync(filePath)){
		_safeMkdirSync(filePath);
		chownFileOwner(filePath);
	}
	if (debugIsAllow("file"))
		IX.log("SAVE " +  fileName + ":" + fileData.length);
	fs.writeFile(fileName, fileData, {
		mode : 0755
	},function(err) {
		chownFileOwner(filePath + "/" + fileName);
		cbFn(err, fileName);
	});
}
function safeChkPath(filePath, filename){
	var fileName = filePath + "/" + filename;
	if (fs.existsSync(fileName))
		return "~" + fileName;
	if (!fs.existsSync(filePath)){
		fs.mkdirSync(filePath, 0755);
		chownFileOwner(filePath);
	}
	return "+" + fileName;
}
function safeChkFile(filePath, filename){
	var result = safeChkPath(filePath, filename);
	return result.charAt(0) == '~' ? null : result.substring(1);
}
function safeRenameAs(oldFilename, filePath, filename){
	var fileName = safeChkFile(filePath, filename);
	if (debugIsAllow("file"))
		IX.log("try RENAME  " +  fileName + " from " + oldFilename);
	if (!fileName)
		return fs.unlinkSync(oldFilename);
	fs.renameSync(oldFilename, fileName);
	chownFileOwner(fileName);
}
function safeCopyTo(srcFile, filePath, filename){
	var fileName = safeChkFile(filePath, filename);
	if (debugIsAllow("file"))
		IX.log("try COPY  " +  fileName + " from " + srcFile);
	if (!fileName)
		return;
	fs.createReadStream(srcFile).pipe(fs.createWriteStream(fileName));
	chownFileOwner(fileName);
}
function safeWriteFileSync(filePath, fileData){
	var dir = path.dirname(filePath);
	_safeMkdirSync(dir);
	fs.writeFileSync(filePath, fileData);
}

var logDir = "/tmp/ix";
function setLogPath(logPath) {
	if (IX.isEmpty(logPath))
		return;
	var arr = logPath.split("/");
	arr.pop();
	var _path = arr.join("/");
	if (!fs.existsSync(_path))
		IX.safeMkdirSync(_path);
	try{
		fs.appendFileSync(logPath + '.log', "\n");	
		logDir = logPath;
		console.log("success set log path : " + _path);
	}catch(ex){
		console.error("Exception as set log dir: " + _path  + "\n" + ex);
	}
}

function _log(type, msg) {
	var dstr = IX.getTimeStrInMS();
	var _msg =  "[" + dstr + "]:" + msg;
	if ("Test" in global && global.Test.debug != "file")
		return console.log(_msg);
	
	var fname = logDir + "." + type.toLowerCase();
	try{
		var fstat = fs.statSync(fname);
		if (fstat && fstat.size > 10000000) // log file size is over 10M, rename file; 
			fs.renameSync(fname, fname + "." + dstr);
	}catch(ex){
		console.error("Exception as rename to log file " +  fname + "." + dstr + " : \n" + ex);
	}
	fs.appendFileSync(fname, _msg + "\n");
}

IX.extend(IX, {
	safeMkdirSync : _safeMkdirSync,
	saveFileIfNotExist : saveFileIfNotExist,
	safeChkPath : safeChkPath,
	safeChkFile : safeChkFile,
	safeRenameAs : safeRenameAs,
	safeCopyTo : safeCopyTo,
	safeWriteFileSync : safeWriteFileSync,
	
	setLogPath : setLogPath,
	err : function(errMsg) {_log("ERR", errMsg);},
	log : function(errMsg) {_log("LOG", errMsg);}
});