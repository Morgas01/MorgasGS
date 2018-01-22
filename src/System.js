(function(µ,SMOD,GMOD,HMOD,SC){

	let gs=µ.gs=µ.gs||{};

	SC=SC({
		rs:"rescope"
	});

	gs.System=µ.Class({
		constructor:function()
		{
			SC.rs.all(this,["pauseListener","keyListener"]);

			this.controllers=new Set();
			this.pause=true;
			this.game=null;
			this.memoryCard=null;

			this.domElement=document.createElement("DIV");
			this.domElement.classList.add("MorgasGS-System");
			this.domElement.tabIndex=-1;

			this.domElement.addEventListener("focus",this.pauseListener,false);
			this.domElement.addEventListener("blur",this.pauseListener,false);

			this.domElement.addEventListener("keydown",this.keyListener,false);
			this.domElement.addEventListener("keyup",this.keyListener,false);
		},
		OLD_SAVE_COUNT:3, //0 => keep all saves; should NEVER be negative
		pauseListener(event)
		{
			this.pause=(event.type==="blur");
			this.domElement.classList.toggle("pause",this.pause);
			if(this.game!=null)
			{
				this.game.pause(this.pause);
			}
		},
		keyListener(event)
		{
			if(HMOD("gs.Controller.Keyboard"))
			{
				let KeyCon=GMOD("gs.Controller.Keyboard");
				let eventConsumed=false;
				for(let con of this.controllers)
				{
					if(con instanceof KeyCon)
					{
						eventConsumed|=con.parseEvent(event);
					}
				}
				if(eventConsumed)
				{
					event.preventDefault();
				}
			}
		},
		appendTo(element)
		{
			element.appendChild(this.domElement);
			return this;
		},
		addControllers(controllers)
		{
			for(let con of controllers) this.addController(con);
		},
		addController(controller)
		{
			this.controllers.add(controller);
			return this;
		},
		propagateControllerChange(event)
		{
			if(!this.pause&&this.game!=null)
			{
				this.game.onControllerChange(event);
			}
		},
		removeControllers(controllers)
		{
			for(let con of controllers) this.removeController(con);
		},
		removeController(controller)
		{
			this.controllers.delete(controller);
			return this;
		},
		setGame(game)
		{
			if(this.game!=null)
			{
				this.game.system=null;
				this.game.pause(true);
				this.domElement.removeChild(this.game.domElement);
			}
			this.game=game;
			if(this.game!=null)
			{
				if(this.game.system!=null)
				{
					this.game.system.setGame(null);
				}
				this.game.system=this;
				this.game.pause(this.pause);
				this.domElement.appendChild(this.game.domElement);
			}
		},
		async save(oldSave)
		{
			if(this.memoryCard==null) throw new ReferenceError("#Game:001 no memory card");

			let param={state:this.program.state};
			if(oldSave!=null)
			{
				param.oldSaves=[oldSave,...(oldSave.oldSaves.slice(0,this.OLD_SAVE_COUNT-1)];
			}
			return this.memoryCard.save(this.program.name,new SC.GameSave(param));
		}
	});

	SMOD("gs.System",gs.System);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);