module("Button",[
	function instantiate(container)
	{
		let button=new µ.gs.Button();
		addResult(container,true);
	},
	function setValue(container)
	{
		let button=new µ.gs.Button();

		button.setValue(80);
		addResult(container,button.value===80,"set");

		button.setValue(-1);
		addResult(container,button.value===0,"min");

		button.setValue(150);
		addResult(container,button.value===100,"max");

		addResult(container,!button.setValue(null),"not null");

		addResult(container,!button.setValue(100),"not same");
	},
	function isPressed(container)
	{
		let button=new µ.gs.Button();
		addResult(container,!button.isPressed(),"not");

		button.setValue(70);
		addResult(container,button.isPressed(),"is");
	},
	function threshold(container)
	{
		let button=new µ.gs.Button({value:50,threshold:80});
		addResult(container,!button.isPressed(),"not");

		button.setThreshold(30);
		addResult(container,button.isPressed(),"is");
	}
]);