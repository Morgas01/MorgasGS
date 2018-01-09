(function(µ,SMOD,GMOD,HMOD,SC){

    let gs=µ.gs||{};

	//SC=SC({});

	gs.Button=µ.Class({
		constructor:function({value=0,threshold:0.5}={})
		{
			this.value=0;
			this.threshold=0.5;

			this.setValue(value);
			this.setThreshold(threshold);
		},
		setThreshold(threshold=0.5)
		{
			this.threshold=Math.min(Math.max(threshold,0),1);
		},
        setValue(value=0)
        {
        	this.value=Math.min(Math.max(value,0),1);
        },
		isPressed()
		{
			return this.value>=this.threshold;
		},
		getState()
		{
			return {
				value:this.value,
				pressed:this.isPressed()
			}
		}
	});

	SMOD("gs.Button",gs.Button);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);