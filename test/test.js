(function(){

	window.module=function(name,testFns)
	{
		let container=getContainer(name);
		if(testFns) for(let test of testFns)
		{
			let testContainer=getContainer(test.name);
			try
			{
				test(testContainer);
			}
			catch (error)
			{
				addResult(testContainer,false,error.message);
				console.error(error);
			}
			container.appendChild(testContainer);
		}
		document.body.appendChild(container);

		let moduleListEntry=document.createElement("li");
		moduleListEntry.innerHTML=String.raw`<a href="#${name}">${name}</a>`
		moduleList.appendChild(moduleListEntry);

	};

	let getContainer=function(name)
	{
		if(name)
		{
			let rtn=document.createElement("fieldset");
			rtn.innerHTML=String.raw`<legend><a name="${name}">${name}</a></legend>`;
			return rtn;
		}
		return document.createElement("div");
	};

	window.addResult=function(container,result,text="")
	{
		let element=document.createElement("DIV");
		element.dataset.test=!!result;
		if(text) text+="\t";
		element.textContent=text+(result?"[OK]":"[ERROR]");
		container.appendChild(element);
}	;

	window.tests.checkGlobals=function()
	{
		let addedGlobals=Object.keys(window).filter(e=>globals.indexOf(e)==-1&&e!="Morgas"&&e!="µ")
		if(addedGlobals.length>0) alert(`⚠ added globals: ${addedGlobals}`);
	};
	let globals=Object.keys(window);


	let moduleList=document.createElement("ul");
	window.addEventListener("load",()=>document.body.insertBefore(moduleList,document.body.firstElementChild));


	tests.loadMorgas("Morgas");

	tests.loadTest("Axis");
	tests.loadTest("Button");
	tests.loadTest("Stick");

	tests.loadMorgas("Morgas.Patch");
	tests.loadMorgas("Morgas.Event");
	tests.loadMorgas("Morgas.util.array.remove");
	tests.loadMorgas("Morgas.util.function.rescope");

	tests.loadTest("Controller");
	tests.loadTest("Controller.Keyboard");

	document.write(String.raw`<script type="application/javascript" charset="utf-8" src="tests/checkGlobals.js" defer></script>`);

})();
