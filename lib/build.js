/** process.argv:  filename, module[, ...module_n] */

require("morgas");
require("..");
let packageJson=require("../package");

let SC=µ.shortcut({
	File:"File",
	util:"File.util",
	DepRes:"DepRes",
	moduleRegister:"Morgas.ModuleRegister",
	moduleDependencies:"Morgas.ModuleDependencies"
});

let rootDir		= new SC.File(__dirname).changePath("..");
let sourceDir	= rootDir.clone().changePath("src");
let outputDir	= rootDir.clone().changePath("build");


/*** dependencies ***/

(new (require("Morgas/lib/dependencyParser"))())
.addSource("src")
.addSource("src/components")
.addProvidedModules(Object.keys(SC.moduleRegister))
.parse("src")
.then(async function(result)
{
	rootDir.clone().changePath("src/ModuleRegister.json").write(JSON.stringify(result.moduleRegister,null,"\t")).then(null,function(err)
	{
		µ.logger.error("could not save ModuleRegister",err);
	});
	rootDir.clone().changePath("src/ModuleDependencies.json").write(JSON.stringify(result.moduleDependencies,null,"\t")).then(null,function(err)
	{
		µ.logger.error("could not save ModuleDependencies",err);
	});

	let resolver=new SC.DepRes(result.moduleDependencies);
	resolver.addConfig(SC.moduleDependencies);

	let createBundle=function(outputFilename,modules)
	{
		let outputFile=outputDir.clone().changePath(outputFilename);
		let outputMap=outputDir.clone().changePath(outputFilename+".map");

		let resolvedModules=resolver.resolve(modules).filter(module=>!(module in SC.moduleRegister));
		let resolvedFiles=resolvedModules.map(module=>
		{
			let file=result.moduleRegister[module];
			if(!file) throw `module "${module}" unknown`;
			return file;
		});

		return SC.util.enshureDir(outputDir)
		.then(()=>Promise.all(resolvedFiles
			.map(f=>sourceDir.clone().changePath(f)
				.read()
				.then(data=>({name:f,data:data}))
			)
		))
		.then(function(fileContents)
		{
			let Concat=require("concat-with-sourcemaps");
			let concat=new Concat(true,outputFilename,"\n/********************/\n");
			for (let {name,data} of fileContents)
			{
				concat.add(name,data,{sourcesContent:[data.toString()]});
			}

			return Promise.all([
				outputFile.write(concat.content+"\n//# sourceMappingURL="+outputMap.getName()),
				outputMap.write(concat.sourceMap)
			]);
		});
	};

	await createBundle("MorgasGS-"+packageJson.version+".js",Object.keys(result.moduleRegister));

	if(process.argv.length>2)
	{
		let outputFilename=process.argv[2];
		let modules=process.argv.slice(3);

		await createBundle(outputFilename,modules);
	}
})
.then(function()
{
	/*** styles ***/

	let lessDir=sourceDir.clone().changePath("less");
	let cssName="MorgasGS-"+packageJson.version+".css";
	let cssMapName=cssName+".map";

	return require("less").render(`
		@import "System";
		@import "Game";
		@import "Game.Remote";
		@import "Game.Embedded";
		@import "Game.SystemSettings";
		@import "components/List";
	`,{
		paths:[lessDir.getAbsolutePath()],
		filename:cssName,
		sourceMap:{outputSourceFiles:true}
	})
	.then(function(data)
	{
		return Promise.all([
			outputDir.clone().changePath(cssName).write(data.css+"\n//# sourceMappingURL="+cssMapName),
			outputDir.clone().changePath(cssMapName).write(data.map)
		]);
	});
})
.then(function()
{
	console.log("build finished!");
},
function(error)
{
	console.error("build failed!",error,error.stack);
	process.exit(1);
});
