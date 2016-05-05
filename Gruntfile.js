require("./base/ix.js");
var fs = require('fs');

module.exports = function (grunt) {
	function getFilePaths(filenames, basedir){
		return IX.map(filenames.split(","), function(fname){return basedir + "/" + fname + ".js";});
	}
	var commonJsFiles = getFilePaths("ix,array,condition,ds,math,date,misc,tpl,task", "base");
	var domJsFiles = getFilePaths("ix,net,misc", "dom");
	var nodeJsFiles =  getFilePaths("ix", "node");

	var hdrStr = fs.readFileSync("base/hdr.js").toString();
	fs.writeFileSync("dist/hdr.js", hdrStr.replace("DATE", IX.getTimeStrInMS()));

	grunt.initConfig({
		pkg : grunt.file.readJSON("package.json"),
		concat: {
			dom: {
				"src": ["dist/hdr.js", "dom/hdr.js"].concat(commonJsFiles, domJsFiles),
				"dest": 'dist/dom/ix.js'
			},
			node : {
				"src": ["dist/hdr.js", "node/hdr.js"].concat(commonJsFiles, nodeJsFiles),
				"dest": 'dist/node/ix.js'
			}
		},
		jshint : {
			options :{
				//curly:true,  //大括号包裹  
				//eqeqeq:true,  //对于简单类型，使用===和!==，而不是==和!=  
				//newcap:true,  //对于首字母大写的函数（声明的类），强制使用new  
				noarg:true,  //禁用arguments.caller和arguments.callee  
				//sub:true,  //对于属性使用aaa.bbb而不是aaa['bbb']  
				undef:true,  //查找所有未定义变量  
				boss:true,//查找类似与if(a = 0)这样的代码  
				node:true,
				globals: {
					IX : true,
					window: true,
					document : true,
					IX_GLOBAL : true,
					IXDebug : true,
					debugIsAllow : true,
					IX_DEBUG_MODE :true,
					IX_SCRIPT_NAME : true,
					IX_VERSION : true,
					"$X" : true,
					"$XA" : true,
					"$XD" : true,
					"$XP" : true,
					"$XE" : true,
					"$XF" : true
				}
			},
			files : {
				src : ['base/*.js', 'dom/*.js', 'node/*.js']
			},
			afterconcat: ['dist/*/ix.js']
		},
		uglify : {
			options: {  
				banner:' /*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd hh:MM:ss") %> */\n',
				beautify: {ascii_only:true},
				maxLineLen : 8192
			},
			
			dom :{
				src:'dist/dom/ix.js',  
				dest:'dist/dom/ix.min.js'  
			},
			node :{  
				src:'dist/node/ix.js',  
				dest:'dist/node/ix.min.js'  
			}
		}
	});

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