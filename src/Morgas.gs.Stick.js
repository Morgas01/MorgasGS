(function(µ,SMOD,GMOD,HMOD,SC){

    let gs=µ.gs||{};

	//SC=SC({});

	gs.Stick=µ.Class({
		constructor:function(xAxis,yAxis)
		{
			this.xAxis=xAxis;
			this.yAxis=yAxis;
		},
		getState()
		{
			let state={
				x:this.xAxis.value,
				y:this.yAxis.value
			};
		}
	});

	SMOD("gs.Stick",gs.Stick);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);