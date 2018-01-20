require("morgas");
require("..");

let SC=µ.shortcut({
	File:"File",
	util:"File.util",
	Promise:"Promise",
	moduleRegister:"Morgas.ModuleRegister"
});

let root				= new SC.File(__dirname).changePath("..");
let src					= root.clone().changePath("src");


/*** dependencies ***/

(new (require("Morgas/lib/dependencyParser")))
.addSource("src")
.addProvidedModules(Object.keys(SC.moduleRegister))
.parse("src")
.then(function(result)
{
	root.clone().changePath("src/ModuleRegister.json").write(JSON.stringify(result.moduleRegister,null,"\t")).then(null,function(err)
	{
		µ.logger.error("could not save ModuleRegister",err);
	});
	root.clone().changePath("src/ModuleDependencies.json").write(JSON.stringify(result.moduleDependencies,null,"\t")).then(null,function(err)
	{
		µ.logger.error("could not save ModuleDependencies",err);
	});
})
.catch(µ.logger.error);

