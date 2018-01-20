module("Button",[
	function instantiate(container)
	{
		let button=new µ.gs.Button();
		addResult(container,true);
	},
	function setValue(container)
	{
		let button=new µ.gs.Button();

		button.setValue(.8);
		addResult(container,button.value===.8,"set");

		button.setValue(-1);
		addResult(container,button.value===0,"min");

		button.setValue(2);
		addResult(container,button.value===1,"max");

		addResult(container,!button.setValue(null),"not null");

		addResult(container,!button.setValue(2),"not same");
	},
	function isPressed(container)
	{
		let button=new µ.gs.Button();
		addResult(container,!button.isPressed(),"not");

		button.setValue(.7);
		addResult(container,button.isPressed(),"is");
	},
	function threshold(container)
	{
		let button=new µ.gs.Button({value:.5,threshold:.8});
		addResult(container,!button.isPressed(),"not");

		button.setThreshold(.3);
		addResult(container,button.isPressed(),"is");
	}
]);