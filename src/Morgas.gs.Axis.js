(function(µ,SMOD,GMOD,HMOD,SC){

    let gs=µ.gs||{};

	//SC=SC({});

	gs.Axis=µ.Class({
		constructor:function({value=0,correction=0,scale=1}={})
		{
			this.value=0;
			this.correction=0;
			this.scale=1;

			this.setValue(value);
			this.setCorrection(correction);
			this.setScale(scale);
		},
		setCorrection(correction=0)
		{
			this.correction=Math.min(Math.max(correction,-1),1);
		},
		setScale(scale=0)
		{
			this.scale=Math.max(correction,Number.EPSILON);
		},
        setValue(value=0)
        {
        	this.value=Math.min(Math.max((value*this.scale+this.correction,-1),1);
        },
		getState()
		{
			return {
				value:this.value
			};
		}
	});

	SMOD("gs.Axis",gs.Axis);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);