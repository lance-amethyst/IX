module.exports = {
	description : "IX project to provide base utilities and classes",
	namespace: "IX",

	concat: {
		tiny: {
			src: ["dist/hdr.js", "tiny/hdr.js",
				"base/ix.js","base/array.js",
				"base/ds.js","base/math.js","base/date.js",

				"dom/ix.js"
			],
			dest: 'dist/tiny/ix.js'
		},
		dom: {
			src: ["dist/hdr.js", "dom/hdr.js",
				"base/ix.js","base/array.js","base/condition.js",
				"base/ds.js","base/math.js","base/date.js",
				"base/misc.js","base/tpl.js","base/task.js",

				"dom/ix.js","dom/net.js","dom/misc.js"
			],
			dest: 'dist/dom/ix.js'
		},
		node: {
			src: ["dist/hdr.js", "node/hdr.js",
				"base/ix.js","base/array.js","base/condition.js",
				"base/ds.js","base/math.js","base/date.js",
				"base/misc.js","base/tpl.js","base/task.js",

				"node/ix.js"
			],
			dest: 'dist/node/ix.js'
		}
	},
	jshint : {
		options: {
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
		files: {
			src : ['base/*.js', 'dom/*.js', 'node/*.js']
		},
		afterconcat: ['dist/*/ix.js']
	},
	uglify: {
		options: {  
			banner:' /*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd hh:MM:ss") %> */\n',
			beautify: {ascii_only:true},
			maxLineLen : 8192
		},
		
		tiny: {
			src:'dist/tiny/ix.js',
			dest:'dist/tiny/ix.min.js'
		},
		dom: {
			src:'dist/dom/ix.js',
			dest:'dist/dom/ix.min.js'
		},
		node: {
			src:'dist/node/ix.js',
			dest:'dist/node/ix.min.js'
		}
	}
};
