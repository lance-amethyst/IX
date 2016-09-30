require("./base/ix.js");
var fs = require('fs');
var ixCfg = require('./config.js');

module.exports = function (grunt) {
	var hdrStr = fs.readFileSync("./base/hdr.js").toString();
	fs.writeFileSync("dist/hdr.js", hdrStr.replace("DATE", IX.getTimeStrInMS()));

	grunt.initConfig(IX.inherit({
		pkg : grunt.file.readJSON("./package.json")
	}, ixCfg));

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	
	grunt.registerTask('autotest', 'code unit test.', function() {  
		try{
			grunt.log.writeln('start autotest ...'); 
			var testTask = require("./testcase/test.js");
			testTask();
			grunt.log.writeln('Autotest done.'); 
		}catch(ex) {
			return false;
		}
	}); 

	grunt.registerTask('default', ['jshint:files', 'autotest', 'concat', 'jshint:afterconcat', 'uglify']);
};