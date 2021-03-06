(function(µ,SMOD,GMOD,HMOD,SC){

    let gs=µ.gs=µ.gs||{};

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
			this.correction=Math.min(Math.max(correction,-100),100);
		},
		setScale(scale=1)
		{
			this.scale=Math.max(scale,Number.EPSILON);
		},
        setValue(value)
        {
        	if(value==null) return false;
        	value=Math.min(Math.max(value*this.scale+this.correction,-100),100);
        	if(this.value==value) return false;
			this.value=value;
			return true;
        },
		getState()
		{
			return {
				value:this.value
			};
		},
		toJSON()
		{
			return {
				correction:this.correction,
				scale:this.scale
			};
		}
	});

	gs.Axis.fromJSON=function(json)
	{
		return new gs.Axis(json);
	};

	SMOD("gs.Axis",gs.Axis);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);