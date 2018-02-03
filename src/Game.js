(function(µ,SMOD,GMOD,HMOD,SC){

	let gs=µ.gs=µ.gs||{};

	//SC=SC({});

	let gameNames=new Map();

	gs.Game=µ.Class({
		[µ.Class.symbols.abstract]:true,
		[µ.Class.symbols.onExtend]:function(sub)
		{
			let sProt=sub.prototype;
			if(!sProt.hasOwnProperty("name")||!sProt.name) throw new SyntaxError("#Game:001 Game has no name");
			if(gameNames.has(sProt.name)) throw new RangeError("#Game:002 Game name must be unique");
			gameNames.set(sProt.name,sub);
		},
		constructor:function({elementTag="DIV",domElement=document.createElement(elementTag)}={})
		{
			this.state=null;
			this.system=null; // set from System.setProgramm()
			this.domElement=domElement;
			this.domElement.classList.add("Game");
			this.domElement.classList.add(this.name);

			this.pause=true;
		},
		setPause(value)
		{
			this.pause=!!value;
		},
		onControllerChange(event){},
		async save(oldSave=null)
		{
			if(this.system!=null)
			{
				return this.system.save(oldSave);
			}
			throw new ReferenceError("#Game:003 System is null");
		},
		async getSaves()
		{
			if(this.system!=null)
			{
				return this.system.getSaves(this.name);
			}
			return [];
		},
		destroy()
		{
			this.domElement.remove();
			this.mega();
		}
	});

	gs.Game.getGameByName=function(name)
	{
		return gameNames.get(name);
	};

	SMOD("gs.Game",gs.Game);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);