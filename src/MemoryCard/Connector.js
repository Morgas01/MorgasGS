(function(µ,SMOD,GMOD,HMOD,SC){

	let MemoryCard=GMOD("gs.MemoryCard");

	SC=SC({
		ObjectConnector:"ObjectConnector",
		GameSave:"gs.GameSave"
	});

	MemoryCard.Connector=µ.Class(MemoryCard,{
		[µ.Class.symbols.abstract]:true,
		[µ.Class.symbols.onExtend]:function(sub)
		{
			if(typeof sub.prototype.getConnector!="function") throw new SyntaxError("#MemoryCard.Connector:001 no getConnector function defined");
		},
		//getConnector(name){},
		save(gameName,gameSave)
		{
			let connector=this.getConnector(gameName);
			return connector.save(gameSave);
		},
		getAll(gameName)
		{
			let connector=this.getConnector(gameName);
			return connector.load(SC.GameSave);
		}
	});

	SMOD("gs.MemCon",MemoryCard.Connector);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);