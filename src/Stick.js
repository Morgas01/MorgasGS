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
		setXAxis(axis)
		{
			this.xAxis=axis;
		},
		setYAxis(axis)
		{
			this.yAxis=axis;
		},
		setValue(valueX,valueY)
		{
			let rtn=this.xAxis.setValue(valueX);
			rtn|=this.yAxis.setValue(valueY);
			return rtn;
		},
		getState()
		{
			return {
				x:this.xAxis.getState(),
				y:this.yAxis.getState()
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
			xAxis:new SC.Axis(json.xAxis),
			yAxis:new SC.Axis(json.yAxis)
		});
	};

	SMOD("gs.Stick",gs.Stick);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);