(function(µ,SMOD,GMOD,HMOD,SC){

    let gs=µ.gs=µ.gs||{};

	SC=SC({
		Axis:"gs.Axis"
	});

	gs.Stick=µ.Class({
		constructor:function(xAxis=new SC.Axis(),yAxis=new SC.Axis())
		{
			this.xAxis=xAxis;
			this.yAxis=yAxis;
		},
		setValue(valueX,valueY)
		{
			return this.xAxis.setValue(valueX)||this.yAxis.setValue(valueY);
		},
		getState()
		{
			let state={
				x:this.xAxis.value,
				y:this.yAxis.value
			};
		},
		toJSON()
		{
			return {
				xAxis:this.xAxis,
				yAxis:this.yAxis
			};
		}
	});

	gs.Stick.fromJSON=function(json)
	{
		return new gs.Stick({
			xAxis:new SC.Acis(json.xAxis),
			yAxis:new SC.Acis(json.yAxis)
		});
	};

	SMOD("gs.Stick",gs.Stick);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);