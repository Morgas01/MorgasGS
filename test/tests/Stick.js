module("Stick",[
	function initialize(container)
	{
		new µ.gs.Stick();
		addResult(container,true)
	},
	function setValue(container)
	{
		let stick=new µ.gs.Stick();
		
		stick.setValue(80,90);
		let state=stick.getState();
		addResult(container,state.x===80&&state.y===90,"set");

		addResult(container,!stick.setValue(),"not null");

		addResult(container,!stick.setValue(80,90),"not same");

		addResult(container,stick.setValue(80,50),"one same");
	}
]);