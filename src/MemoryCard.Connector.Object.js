(function(µ,SMOD,GMOD,HMOD,SC){

	let MemCon=GMOD("gs.MemCon");

	SC=SC({
		ObjectConnector:"ObjectConnector"
	});

	MemCon.Object=µ.Class(MemCon,{
		constructor:function(global=false)
		{
			this.connectors=new Map();
			this.global=global;
		},
		getConnector(name)
		{
			if(!this.connectors.has(name))
			{
				this.connectors.set(name,new SC.ObjectConnector(this.global));
			}
			return this.connectors.get(name);
		}
	});

	SMOD("gs.MemCon.Object",MemCon.Object);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);