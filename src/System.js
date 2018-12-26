(function(µ,SMOD,GMOD,HMOD,SC){

	let gs=µ.gs=µ.gs||{};

	SC=SC({
		rs:"rescope"
	});

	/**
	 *
	 *
	 *
	 *
	 *
	 */
	gs.System=µ.Class({
		constructor:function()
		{
			SC.rs.all(this,["pauseListener","keyListener","doPoll"]);

			this.pauseTimer=null;

			this.controllers=new Set();
			this.pause=true;
			this.game=null;
			this.memoryCard=null;

			this.domElement=document.createElement("DIV");
			this.domElement.classList.add("System","pause");
			this.domElement.tabIndex=-1;

			this.domElement.addEventListener("focusin",this.pauseListener,false);
			this.domElement.addEventListener("focusout",this.pauseListener,false);

			this.domElement.addEventListener("keydown",this.keyListener,false);
			this.domElement.addEventListener("keyup",this.keyListener,false);

			this.poll=null;

		},
		OLD_SAVE_COUNT:3, //0 => keep all saves; should NEVER be negative
		pauseListener(event)
		{
			clearTimeout(this.pauseTimer);
			let pause=(event.type==="focusout");
			this.pauseTimer=setTimeout(()=>
			{
				if(this.pause===pause) return;

				this.pause=pause;
				this.domElement.classList.toggle("pause",this.pause);
				if(this.game!=null)
				{
					this.game.setPause(this.pause);
				}
				this.updatePoll(this.pause?null:false);
			},50);
		},
		keyListener(event)
		{
			if(HMOD("gs.Con.Keyboard"))
			{
				let KeyCon=GMOD("gs.Con.Keyboard");
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
		updatePoll(force)
		{
			let check=force===true?true:force===false?false:this.shouldPoll();
			if (check)
			{
				clearInterval(this.poll);
				this.poll=setInterval(this.doPoll,1000);
				//this.doPoll();
			}
			else
			{
				clearInterval(this.poll);
				//cancelAnimationFrame(this.poll);
				this.poll=null;
			}
		},
		shouldPoll()
		{
			if(this.poll!==null) return false;

			if(HMOD("gs.Con.Gamepad"))
			{
				let Gamepad=GMOD("gs.Con.Gamepad");
				for(let controller of this.controllers)
				{
					if(controller instanceof Gamepad) return true;
				}
			}

			return false;
		},
		doPoll()
		{
			//TODO hold list of gamepads?
			if(HMOD("gs.Con.Gamepad"))
			{
				//this.poll=requestAnimationFrame(this.doPoll);
				let Gamepad=GMOD("gs.Con.Gamepad");
				for(let controller of this.controllers)
				{
					if(controller instanceof Gamepad) controller.update();
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
			controller.addEventListener("controllerChange",this,this.propagateControllerChange)
			this.updatePoll();
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
			controller.removeEventListener("controllerChange",this);
			this.updatePoll();
			return this;
		},
		setGame(game)
		{
			if(this.game!=null)
			{
				this.game.system=null;
				this.game.setPause(true);
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
				this.game.setPause(this.pause);
				this.domElement.appendChild(this.game.domElement);
			}
		},
		async save(oldSave)
		{
			if(this.memoryCard==null) throw new ReferenceError("#Game:001 no memory card");

			let param={state:this.program.state};
			if(oldSave!=null)
			{
				param.oldSaves=[oldSave,...(oldSave.oldSaves.slice(0,this.OLD_SAVE_COUNT-1))];
			}
			return this.memoryCard.save(this.program.name,new SC.GameSave(param));
		}
	});

	SMOD("gs.System",gs.System);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);