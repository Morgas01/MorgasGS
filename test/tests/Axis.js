module("Axis",[
	function instantiate(container)
	{
		let axis=new µ.gs.Axis();
		addResult(container,true);
	},
	function setValue(container)
	{
		let axis=new µ.gs.Axis();

		axis.setValue(80);
		addResult(container,axis.value===80,"set");

		axis.setValue(-150);
		addResult(container,axis.value===-100,"min");

		axis.setValue(150);
		addResult(container,axis.value===100,"max");

		addResult(container,!axis.setValue(null),"not null");

		addResult(container,!axis.setValue(100),"not same");
	},
	function correction(container)
	{
		let axis=new µ.gs.Axis({correction:30});

		addResult(container,axis.value==0,"initial");

		axis.setValue(0);
		addResult(container,axis.value==30,"corrected");

		axis.setValue(-120);
		addResult(container,axis.value==-90,"corrected 2");
	},
	function scale(container)
	{
		let axis=new µ.gs.Axis({scale:2});

		axis.setValue(20);
		addResult(container,axis.value===40,"scale");
	},
	function scaleCorrection(container)
	{
		let axis=new µ.gs.Axis({scale:2,correction:-100}); // eg from range 0 - 100 to -100 - 100

		axis.setValue(50);
		addResult(container,axis.value===0,"set");

		axis.setValue(30);
		addResult(container,axis.value===-40,"set 2");

		axis.setValue(-10);
		addResult(container,axis.value===-100,"min");

		axis.setValue(110);
		addResult(container,axis.value===100,"max");
	}
]);