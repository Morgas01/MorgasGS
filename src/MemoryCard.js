(function(µ,SMOD,GMOD,HMOD,SC){

	let gs=µ.gs=µ.gs||{};

	//SC=SC({});

	gs.MemoryCard=µ.Class({
		[µ.Class.symbols.abstract]:true,
		[µ.Class.symbols.onExtend]:function(sub)
		{
			if(typeof sub.prototype.save!="function") throw new SyntaxError("#MemoryCard:001 no save function defined");
			if(typeof sub.prototype.getAll!="function") throw new SyntaxError("#MemoryCard:001 no getAll function defined");
		},
		//async save(gameName,gameSave){},
		//async getAll(gameName){}
	});

	SMOD("gs.MemoryCard",gs.MemoryCard);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);