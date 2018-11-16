(function(µ,SMOD,GMOD,HMOD,SC){

    let gs=µ.gs=µ.gs||{};

    let Axis=GMOD("gs.Axis");

	//SC=SC({});

	gs.Button=µ.Class(Axis,{
		constructor:function(param={})
		{
			param.min=0;
			param.max=100;
			this.mega(param);
		}
	});

	gs.Button.fromJSON=function(json)
	{
		return new gs.Button(json);
	};

	SMOD("gs.Button",gs.Button);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);