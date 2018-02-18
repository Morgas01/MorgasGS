(function(µ,SMOD,GMOD,HMOD,SC){

	let gs=µ.gs=µ.gs||{};

	SC=SC({
		rs:"rescope"
	});

	gs.System=µ.Class({
		constructor:function()
		{
			SC.rs.all(this,["pauseListener","keyListener","doPoll"]);

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
			this.pause=(event.type==="focusout");
			this.domElement.classList.toggle("pause",this.pause);
			if(this.game!=null)
			{
				this.game.setPause(this.pause);
			}
			if(this.pause)
			{
				cancelAnimationFrame(this.poll);
				this.poll=null;
			}
			else if (this.shouldPoll())
			{
				this.doPoll();
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
		shouldPoll()
		{
			if(this.poll!==null) return false;

			if(HMOD("gs.Controller.Gamepad"))
			{
				let Gamepad=GMOD("gs.Controller.Gamepad");
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
			if(HMOD("gs.Controller.Gamepad"))
			{
				let Gamepad=GMOD("gs.Controller.Gamepad");
				for(let controller of this.controllers)
				{
					if(controller instanceof Gamepad) controller.update();
				}
			}
			this.poll=requestAnimationFrame(this.doPoll);
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
/********************/
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
/********************/
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
/********************/
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
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let gs=µ.gs=µ.gs||{};

	let DBObj=GMOD("DBObj");

	//SC=SC({});

	gs.GameSave=µ.Class(DBObj,{
		objectType:"GameSave",
		constructor:function(param={})
		{
			this.mega(param);

			let {
				date=new Date(),
				oldSaves=[],
				state=null
			}=param;

			if(oldSaves.length>gs.GameSave.OLD_SAVE_COUNT)
			{
				oldSaves.length=gs.GameSave.OLD_SAVE_COUNT;
			}

			this.addField("date",		FIELD.TYPES.DATE	,date );
			this.addField("state",		FIELD.TYPES.JSON	,state);
			this.addField("oldSaves",	FIELD.TYPES.JSON	,oldSaves);
		}
	});
	gs.GameSave.OLD_SAVE_COUNT=3;

	SMOD("gs.GameSave",gs.GameSave);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
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
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

    let gs=µ.gs=µ.gs||{};

	SC=SC({
		Axis:"gs.Axis"
	});

	gs.Stick=µ.Class({
		constructor:function(xAxis=new SC.Axis(),yAxis=new SC.Axis())
		{
			this.xAxis=xAxis;
			this.yAxis=yAxis;
		},
		setXAxis(axis)
		{
			this.xAxis=axis;
		},
		setYAxis(axis)
		{
			this.yAxis=axis;
		},
		setValue(valueX,valueY)
		{
			let rtn=this.xAxis.setValue(valueX);
			rtn|=this.yAxis.setValue(valueY);
			return rtn;
		},
		getState()
		{
			return {
				x:this.xAxis.value,
				y:this.yAxis.value
			};
		},
		toJSON()
		{
			return {
				xAxis:this.xAxis,
				yAxis:this.yAxis
			};
		}
	});

	gs.Stick.fromJSON=function(json)
	{
		return new gs.Stick({
			xAxis:new SC.Acis(json.xAxis),
			yAxis:new SC.Acis(json.yAxis)
		});
	};

	SMOD("gs.Stick",gs.Stick);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let Game=GMOD("gs.Game");

	SC=SC({
		rescope:"rescope",
		//for ControllerConfig
		Keyboard:"gs.Controller.Keyboard",
		Gamepad:"gs.Controller.Gamepad"
	});

	Game.SystemSettings=µ.Class(Game,{
		name:"SystemSettings",
		constructor:function(callback)
		{
			SC.rescope.all(this,["onAction"]);
			this.mega();
			this.busy=null;
			this.callback=callback;
			this.actionsContainer=document.createElement("DIV");
			this.actionsContainer.classList.add("actions");
			this.actionsContainer.innerHTML=`
				<button data-action="controllerConfig">Controller Config</button>
				<button data-action="exit">Exit</button>
			`;
			this.actionsContainer.addEventListener("click",this.onAction);
			this.domElement.appendChild(this.actionsContainer);
		},
		onAction(event)
		{
			if(this.busy) return;
			switch(event.target.dataset.action)
			{
				case "controllerConfig":
					this.busy=Game.SystemSettings.controllerConfig(this);
					break;
				case "exit":
					if(this.callback) this.callback();
					return;
			}
			this.actionsContainer.remove();
			this.busy.catch(µ.logger.error)
			.then(()=>
			{
				this.domElement.appendChild(this.actionsContainer);
				this.busy=null;
			});
		}
	});

	SMOD("gs.Game.SystemSettings",Game.SystemSettings);

	let controllerConfig=Game.SystemSettings.controllerConfig=function(game)
	{
		let system=game.system;
		let domElement=document.createElement("DIV");
		domElement.classList.add("controllerConfig");
		let menu=document.createElement("DIV");
		menu.classList.add("menu");
		menu.innerHTML=`
			<div class="addController" tabindex="-1">
				<span>➕</span>
				<div>
					<div data-action="addGamepad">🎮</div>
					<div data-action="addKeyboard">⌨</div>
				</div>
			</div>
			<div data-action="edit">⚙</div>
			<div data-action="remove">➖</div>
		`;
		domElement.appendChild(menu);


		let list=document.createElement("DIV");
		list.classList.add("list");
		domElement.appendChild(list);
		let controllerMap=new Map();
		let controllerIcons=new Map([
			[SC.Keyboard.prototype.constructor,"⌨"],
			[SC.Gamepad.prototype.constructor,"🎮"],
		]);

		let counter=0;
		for(let controller of system.controllers)
		{
			let element=document.createElement("LABEL");
			element.innerHTML=`
				<input type="radio" name="ControllerConfig-list">
				<div>${controllerIcons.get(controller.constructor)||"⁈"}</div>
				<div>test ${++counter}
			`;
			controllerMap.set(element,controller);
			controllerMap.set(controller,element);
			list.appendChild(element);
		}

		menu.addEventListener("click",function(event)
		{
			switch(event.target.dataset.action)
			{
				case "addGamepad":
					controllerConfig.selectGamepad(game,domElement)
					.then(newGameCon=>{
						system.addController(newGameCon);
						controllerConfig.edit(newGameCon,domElement);
					});
					break;
				case "addKeyboard":
					let newKeyCon=new SC.Keyboard();
					system.addController(newKeyCon);
					controllerConfig.edit(newKeyCon,domElement);
					break;
				case "edit":
					let selected=list.querySelector(":checked").parentNode;
					let controller=controllerMap.get(selected);
					controllerConfig.edit(controller,domElement);
					break;
				case "remove":
					break;
			}
		});

		let okBtn=document.createElement("BUTTON");
		okBtn.textContent="OK";
		domElement.appendChild(okBtn);
		game.domElement.appendChild(domElement);
		return new Promise(function(resolve)
		{
			okBtn.addEventListener("click",function()
			{
				game.domElement.removeChild(domElement);
				resolve();
			});
		});
	};
	controllerConfig.edit=function(controller,domElement)
	{
		switch(controller.constructor)
		{
			case SC.Keyboard.prototype.constructor:
				// TODO
				//controllerConfig.edit.Keyboard(controller,domElement);
				break;
			case SC.Gamepad.prototype.constructor:
				controllerConfig.edit.Gamepad(controller,domElement);
				break;
		}
	};
	controllerConfig.selectGamepad=function(game,domElement)
	{
		return new Promise(function(resolve,reject)
		{
			let chooseContainer=document.createElement("DIV");
			chooseContainer.classList.add("selectGamepad");

			let gamepads;
			let updateChoice=function()
			{
				gamepads=navigator.getGamepads();
				for(let controller of game.system.controllers)
				{
					if(controller instanceof SC.Gamepad)
					{
						gamepads[controller.gamepad.index]=null;
					}
				}
				gamepads=gamepads.filter(µ.constantFunctions.pass);
				chooseContainer.innerHTML=`
					<select>
						<option value=""/>
						${gamepads.map(g=>
						`<option value="${g.index}">${g.id}</option>`)
						.join("\n")}
					</select>
					<div class="gamepad-hint">press any button to activate gamepad</div>
					<div>
						<button data-action="ok">OK</button>
						<button data-action="cancel">Cancel</button>
					</div>
				`;
			};
			window.addEventListener("gamepadconnected",updateChoice);
			updateChoice();
			domElement.appendChild(chooseContainer);

			chooseContainer.addEventListener("click",function(event)
			{
				switch(event.target.dataset.action)
				{
					case "cancel":
						window.removeEventListener("gamepadconnected",updateChoice);
						reject();
						break;
					case "ok":
						let select=chooseContainer.children[0];
						let gamepad=gamepads[select.value]
						if(gamepad)
						{
							window.removeEventListener("gamepadconnected",updateChoice);
							resolve(new SC.Gamepad(gamepad));
						}
						break;
				}
			});
		});
	};
	controllerConfig.edit.Gamepad=function(controller,domElement)
	{

	};

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let Game=GMOD("gs.Game");

	SC=SC({
		rs:"rescope"
	});

	/**
	 * Game Class to execute an gs.Game.Embedded using an iframe
	 */
	Game.Remote=µ.Class(Game,{
		[µ.Class.symbols.abstract]:function(name,url)
		{
			return {name:name,url:new URL(url,location.href)};
		},
		[µ.Class.symbols.onExtend]:function(sub)
		{
			Game.prototype[µ.Class.symbols.onExtend](sub);
			let sProt=sub.prototype;
			if(!sProt.url) throw new SyntaxError("#Game.Remote:001 Game has no url");
			if(!(sProt.url instanceof URL)) throw new SyntaxError("#Game.Remote:002 Game url is not an instance of URL");
		},
		constructor:function()
		{
			SC.rs.all(this,["_onLoad","_onMessage","_sendPause"]);
			this.mega({elementTag:"IFRAME"});
			this.domElement.classList.add("Remote")
			this.domElement.sandbox="allow-orientation-lock allow-pointer-lock allow-scripts allow-same-origin";
			this.domElement.src=this.url;
			this.domElement.addEventListener("load",this._onLoad,false);
			window.addEventListener("message",this._onMessage,false);

			let pauseTimer=null;
		},
		_onLoad()
		{
			this.setPause(this.pause);
		},
		_onMessage(event)
		{
			if(event.origin===this.url.origin)
			{
				let message=event.data;
				let promise=null;
				switch(message.type)
				{
					case "save":
						this.state=message.state;
						promise=this.save(message.oldSave)
						break;
					case "getSaves":
						promise=this.getSaves(message.oldSave);
						break;
					case "reclaimFocus":
						this.reclaimFocus();
						break;
				}
				if(promise)
				{
					promise.then(data=>({data:data}),error=>({error:error}))
					.then(answer=>
					{
						answer.request=message.request;
						this._send(answer);
					});
				}
			}
		},
		_send(message)
		{
			if(this.domElement.contentWindow)
			{
				this.domElement.contentWindow.postMessage(message,this.url.origin);
			}
		},
		setPause(value)
		{
			this.mega(value);
			clearTimeout(this.pauseTimer);
			this.pauseTimer=setTimeout(this._sendPause,15)
		},
		_sendPause()
		{
			this._send({
				type:"pause",
				value:this.pause
			});
		},
		onControllerChange(event)
		{
			this._send({
				type:"controllerEvent",
				event:event
			});
		},
		reclaimFocus()
		{
			if(this.system!=null)
			{
				this.system.domElement.focus();
			}
		},
		destroy()
		{
			window.removeEventListener("message",this._onMessage,false);
			this.mega();
		}
	});

	SMOD("gs.Game.Remote",Game.Remote);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let Game=GMOD("gs.Game");

	SC=SC({
		rs:"rescope",
		Promise:"Promise"
	});

	let REQUEST_COUNTER=0;

	Game.Embedded=µ.Class(Game,{
		[µ.Class.symbols.abstract]:true,
		constructor:function(param={})
		{
			SC.rs.all(this,["_onMessage","_onFocus"]);

			param.domElement=document.body;

			this.mega(param);
			this.domElement.classList.add("Embedded");

			({
				timeout:this.timeout=50000
			}=param);

			this.requestMap=new Map();
			window.addEventListener("message",this._onMessage);
			window.addEventListener("focus",this._onFocus);
		},
		_send(message)
		{
			window.parent.postMessage(message,window.parent.origin);
		},
		_request(message)
		{
			message.request=REQUEST_COUNTER++;

			let timer;
			let promise=new SC.Promise(()=>
			{
				this.requestMap.set(message.request,signal);
				timer=setTimeout(()=>
				{
					signal.reject("timeout");
				},this.timeout);
			},{scope:this});
			promise.always(()=>
			{
				this.requestMap.delete(message.request);
				clearTimeout(timer);
			});
		},
		_onMessage(event)
		{
			let message=event.data;
			if("request" in message)
			{
				if(!this.requestMap.has(message.request))
				{
					µ.logger.error("#Game.Embedded:001 no such request "+message.request);
				}
				else
				{
					let signal=this.requestMap.get(event.data.request);

					if(message.error) signal.reject(error);
					else signal.resolve(message.data);
				}
			}
			else
			{
				switch(message.type)
				{
					case "pause":
						this.setPause(message.value);
						break;
					case "controllerEvent":
						this.onControllerChange(message.event);
						break;
				}
			}
		},
		save(oldSave)
		{
			return this._request({type:"save",oldSave:oldSave,state:this.state});
		},
		getSaves()
		{
			return this._request({type:"getSaves"});
		},
		_onFocus()
		{
			if(document.activeElement===document.body)
			{
				this._send({type:"reclaimFocus"});
			}
		}
	});

	SMOD("gs.Game.Embedded",Game.Embedded);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let gs=µ.gs=µ.gs||{};

	let Event=GMOD("Event");

	SC=SC({
		remove:"array.remove",
		removeIf:"array.removeIf",
		Reporter:"EventReporterPatch",

		Button:"gs.Button",
		Axis:"gs.Axis",
		Stick:"gs.Stick"
	});

	let NEXT_CONTROLLER_ID=0;

	gs.Controller=µ.Class({
		constructor:function({buttons=[],axes=[],sticks=[]}={})
		{
			this.ID=NEXT_CONTROLLER_ID++;

			this.buttons=[];
			this.axes=[];
			this.sticks=[];

			this.addButtons(buttons);
			this.addAxes(axes);
			this.addSticks(sticks);

			new SC.Reporter(this)
			.introduce(gs.Controller.ChangeEvent);

		},
		addButtons(buttons)
		{
			this.buttons.push(...buttons);
		},
		removeButtons(buttons)
		{
			SC.removeIf(this.buttons,buttons.includes,true,buttons)
		},
		removeButton(button)
		{
			SC.remove(this.buttons,button);
		},
		addAxes(axes)
		{
			this.axes.push(...axes);
		},
		removeAxes(axes)
		{
			SC.removeIf(this.axes,axes.includes,true,axes)
		},
		removeAxe(axe)
		{
			SC.remove(this.axes,axe);
		},
		addSticks(sticks)
		{
			this.sticks.push(...sticks);
		},
		removeSticks(sticks)
		{
			SC.removeIf(this.sticks,sticks.includes,true,sticks)
		},
		removeStick(stick)
		{
			SC.remove(this.sticks,stick);
		},
		getState()
		{
			return {
				buttons:this.buttons.map(b=>b.getState()),
				axes:this.axes.map(a=>a.getState()),
				sticks:this.sticks.map(s=>s.getState()),
			};
		},
		setButton:function(index,value)
		{
			if(index<0||index>=this.buttons.length)
			{
				µ.logger.error(`#gs.Controller:001 index out of bounds (Button ${index})`);
				return;
			}
			let button=this.buttons[index];
			if(button.setValue(value))
			{
				this.reportEvent(new gs.Controller.ChangeEvent(this,"button",index,button.getState()));
			}
		},
		setAxis:function(index,value)
		{
			if(index<0||index>=this.axes.length)
			{
				µ.logger.error(`#gs.Controller:002 index out of bounds (Axis ${index})`);
				return;
			}
			let axis=this.axes[index];
			if(axis.setValue(value))
			{
				this.reportEvent(new gs.Controller.ChangeEvent(this,"axis",index,axis.getState()));
			}
		},
		setStick:function(index,valueX,valueY)
		{
			if(index<0||index>=this.sticks.length)
			{
				µ.logger.error(`#gs.Controller:003 index out of bounds (stick ${index})`);
				return;
			}
			let stick=this.sticks[index];
			if(stick.setValue(valueX,valueY))
			{
				this.reportEvent(new gs.Controller.ChangeEvent(this,"stick",index,stick.getState()));
			}
		},
		toJSON()
		{
			return {
				buttons:this.buttons,
				axes:this.axes,
				sticks:this.sticks
			};
		}
	});

	gs.Controller.fromJSON=function(json)
	{
		if(json.buttons) json.buttons=buttons.map(SC.Button.fromJSON);
		if(json.axes) json.axes=json.axes.map(SC.Axis.fromJSON);
		if(json.sticks) json.sticks=json.sticks.map(SC.Sticks.fromJSON);

		return new gs.Controller(buttons,axes,sticks);
	};

	SMOD("gs.Controller",gs.Controller);

	gs.Controller.ChangeEvent=µ.Class(Event,
	{
		name:"controllerChange",
		constructor:function(controller,type,index,value)
		{
			/** @type {gs.Controller} */
			this.controllerID=controller.ID
			/** @type {String} "button", "axis" or "stick" */
			this.type=type;
			/** @type {Number} */
			this.index=index;
			/** @type {gs.Button|gs.Axes|gs.Stick} */
			this.value=value;
		}
	});

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let Controller=GMOD("gs.Controller");

	SC=SC({
		Button:"gs.Button",
		Axis:"gs.Axis",
		Stick:"gs.Stick"
	});

	Controller.Keyboard=µ.Class(Controller,{
		/**
		 * @typedef {Object} Controller.Keyboard~mappings
		 * @param {Object.<String,Number>} (param.buttons)
		 * @param {Object.<String,{index:Number,negative:Boolean}}>} (param.axes)
		 * @param {Object.<String,{index:Number,axis:String,negative:Boolean}>} (param.sticks)
		 */
		 /**
		  * @param {Object} param
		  * @param {Controller.Keyboard~mappings} param.mappings
		  * @param {Boolean} (generateButtons) defaults to true if no Button is defined
		  * @param {Boolean} (generateAxes) defaults to true if no Axis is defined
		  * @param {Boolean} (generateSticks) defaults to true if no Stick is defined
		  */
		constructor:function(param={})
		{
			this.mega(param);

			this.mapping=new Map();


			if(param.mappings) this.associate(param.mappings);

			let {
				generateButtons=this.buttons.length==0,
				generateAxes=this.axes.length==0,
				generateSticks=this.sticks.length==0
			}=param;

			if(generateButtons) this.generateButtons();
			if(generateAxes) this.generateAxes();
			if(generateSticks) this.generateSticks();

		},
		associate({buttons={},axes={},sticks={}})
		{
			for(let key in buttons)
			{
				this.associateButton(key,buttons[key]);
			}

			for(let key in axes)
			{
				let settings=axes[key];
				this.associateAxis(key,settings.index,settings.negative);
			}

			for(let key in sticks)
			{
				let settings=sticks[key];
				this.associateStick(key,settings.index,settings.axis,settings.negative);
			}
		},
		associateButton(key,index)
		{
			if(!(index in this.buttons))
			{
				this.buttons[index]=new SC.Button();
			}
			this.mapping.set(key,{
				type:"button",
				index:index
			});
		},
		associateAxis(key,index,negative)
		{
			if(!(index in this.axes))
			{
				this.axes[index]=new SC.Axis();
			}
			this.mapping.set(key,{
				type:"axis",
				index:index,
				negative:negative
			});
		},
		/**
		 * @param {String} key
		 * @param {Number} index
		 * @param {String} axis - "x" or "y"
		 * @param {boolean} (negative)
		 */
		associateStick(key,index,axis,negative)
		{
			if(!(index in this.sticks))
			{
				this.sticks[index]=new SC.Stick();
			}
			this.mapping.set(key,{
				type:"stick",
				axis:axis,
				index:index,
				negative:negative
			});
		},
		generateButtons()
		{
			for(let value of this.mapping.values())
			{
				if(value.type=="button"&&this.buttons[value.index]==null)
				{
					this.buttons[value.index]=new SC.Button();
				}
			}
		},
        generateAxes()
        {
        	for(let value of this.mapping.values())
        	{
        		if(value.type=="axis"&&this.axes[value.index]==null)
        		{
        			this.axes[value.index]=new SC.Axis();
        		}
        	}
        },
        generateSticks()
        {
        	for(let value of this.mapping.values())
        	{
        		if(value.type=="stick"&&this.sticks[value.index]==null)
        		{
        			this.sticks[value.index]=new SC.Stick();
        		}
        	}
        },
        /**
         * @param {Event} event
         * @returns {Boolean} event consumed
         */
		parseEvent:function(event)
		{
			let mapping=this.mapping.get(event.code);
			if(mapping)
			{
				let value=(event.type=="keydown"?100:0);
				switch (mapping.type)
				{
					case "button":
						return this.setButton(mapping.index,value);
						break;
					case "axis":
						if(mapping.negative) value=-value;
						return this.setAxis(mapping.index,value);
						break;
					case "stick":
						if(mapping.negative) value=-value;
						let valueX=null;
						let valueY=null;
						if(mapping.axis==="x") valueX=value;
						else valueY=value;
						return this.setStick(mapping.index,valueX,valueY);
						break;
				}
			}
			return false;
		},
		toJSON()
		{
			let json=this.mega();
			json.mappings=[...this.mappings.entries()];
		}
	});

	Controller.Keyboard.fromJSON=function(json)
	{
		if(json.buttons) json.buttons=buttons.map(SC.Button.fromJSON);
		if(json.axes) json.axes=json.axes.map(SC.Axis.fromJSON);
		if(json.sticks) json.sticks=json.sticks.map(SC.Sticks.fromJSON);

		let rtn=new Controller.Keyboard(json);

		return rtn;
	};

	SMOD("gs.Controller.Keyboard",Controller.Keyboard);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let Controller=GMOD("gs.Controller");

	SC=SC({
		Button:"gs.Button",
		Axis:"gs.Axis",
		Stick:"gs.Stick"
	});

	Controller.Gamepad=µ.Class(Controller,{
		constructor:function(gamepad,param={})
		{
			delete param.sticks // don't adopt sticks, because they are generated from associations to axes
			this.mega(param);
			this.gamepad=gamepad;

			this.mappings={
				buttons:{},
				axes:{},
				sticks:{}
			};
			for(let i=0;i<this.gamepad.buttons.length;i++)
			{
				// generate missing buttons
				if(this.buttons.length===i) this.buttons[i]=new SC.Button();;
				this.mappings.buttons[i]=i;
			}
			for(let i=0;i<this.gamepad.axes.length;i++)
			{
				// generate missing axes
				if(this.axes.length===i) this.axes[i]=new SC.Axis();
				this.mappings.axes[i]=i;
			}

			if(param.mappings) this.associate(param.mappings);

		},
		associate({buttons={},axes={},sticks={}})
		{
			for(let key in buttons)
			{
				this.associateButton(key,buttons[key]);
			}

			for(let key in axes)
			{
				let settings=axes[key];
				this.associateAxis(key,settings.index,settings.negative);
			}

			for(let key in sticks)
			{
				let settings=sticks[key];
				this.associateStick(key,settings.index,settings.axis,settings.negative);
			}
		},
		/**
		 * @param {Number} fromIndex
		 * @param {Number} toIndex - null means ignore button
		 */
		associateButton(fromIndex,toIndex)
		{
			this.mapping.buttons[fromIndex]=toIndex;
		},
		/**
		 * @param {Number} fromIndex
		 * @param {Number} toIndex - null means ignore axis
		 */
		associateAxis(fromIndex,toIndex)
		{
			this.mapping.axes[fromIndex]=toIndex;
		},
		/**
		 * @param {Number} axisIndex
		 * @param {Number} stickIndex
		 * @param {String} direction - "x" or "y"
		 */
		associateStick(axisIndex,stickIndex,direction)
		{
			this.mapping.sticks[axisIndex]={
				index:stickIndex,
				direction:direction
			};

			if(!(stickIndex in this.sticks))
			{
				this.sticks[stickIndex]=new SC.Stick();
			}
			if(direction==="x") this.sticks[stickIndex].setXAxis(this.axes[axisIndex]);
			else this.sticks[stickIndex].setYAxis(this.axes[axisIndex]);

			// remove axis mapping
			delete this.mapping.axes[axisIndex];
		},
		update()
		{
			let gamepad=navigator.getGamepads()[this.gamepad.index];
			if(this.gamepad.timestamp!=gamepad.timestamp)
			{
				this.gamepad=gamepad;

				for(let i=0;i<=gamepad.buttons.length;i++)
				{
					let buttonIndex=this.mappings.buttons[i];
					if(buttonIndex!=null) this.buttons[buttonIndex].setValue(gamepad.buttons[i].value);
				}

				for(let i=0;i<=gamepad.axes.length;i++)
				{
					let stickMapping=this.mappings.sticks
					if(stickMapping)
					{
						let valueX=null;
						let valueY=null;
						if(stickMapping.direction==="x") valueX=gamepad.axes[i];
						else valueY=gamepad.axes[i];
						return this.setStick(stickMapping.index,valueX,valueY);
					}
					else
					{
						let axisIndex=this.mappings.axes[i];
						if(axisIndex!=null) this.axes[axisIndex].setValue(gamepad.axes[i]);
					}
				}
			}
		},
		toJSON()
		{
			let json=this.mega();
			json.mappings=this.mappings;
		}
	});

	SMOD("gs.Controller.Gamepad",Controller.Gamepad);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let gs=µ.gs=µ.gs||{};

	//SC=SC({});

	/** @typedef {Object} controllerMapping
	 * @property {Object.<Number,String>} (button)
	 * @property {Object.<Number,String>} (axis)
	 * @property {Object.<Number,String>} (stick)
	 */

	gs.Component=µ.Class({
		[µ.Class.symbols.abstract]:true,
		constructor:function(controllerMapping=new Map())
		{
			/** @type {Map.<Number,controllerMapping>} */
			this.controllerMapping=controllerMapping;
			/** @type {WeakMap.<Number,Set<Number>>} */
			this.pressedButtons=new WeakMap();
		},
		addControllerMapping(controllerID,type,index,action)
		{
			if(!this.controllerMapping.has(controllerID))
			{
				this.controllerMapping.set(controllerID,{});
			}
			let mapping=this.controllerMapping.get(controllerID);
			if(!mapping[type]) mapping[type]={};
			mapping[type][index]=action;
			return this;
		},
		/** @type {Object.<String,Function>} */
		actions:{},
		/**
		 * @param {gs.Controller.ChangeEvent} event
		 * @returns {boolean} consumed
		 */
		consumeControllerChange(event)
		{
			let mapping=this.controllerMapping.get(event.controllerID);
			if(!mapping)
			{
				mapping=this.controllerMapping.get(null);
			}
			if(mapping&&mapping[event.type])
			{
				let typeMapping=mapping[event.type];
				let indexMapping=typeMapping[event.index]||typeMapping[null];
				if(indexMapping&&indexMapping in this.actions)
				{
					let action=this.actions[indexMapping];
					action.call(this,event.value,event);
					return true;
				}
			}
			return false;
		},
		/**
		 * keeps track of pressed buttons and returns true if a button was pressed now
		 * @protected
		 * @param {gs.Controller.ChangeEvent} event
		 * @returns {Boolean} button pressed now
		 */
		_acceptButton(event)
		{
			if(!button.pressed)
			{
				this.pressedButtons.delete(event.index);
				return false;
			}
			else if(!this.pressedButtons.has(event.index))
			{
				this.pressedButtons.add(event.index);
				return true;
			}
		}
	});

	SMOD("gs.Component",gs.Component);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let Component=GMOD("gs.Component");

	SC=SC({
		rs:"rescope"
	});

	Component.List=µ.Class(Component,{
		constructor:function(data=[],mapper=Component.STD_MAPPER,{columns=1,active=0,controllerMapping=Component.STD_CONTROLLER_MAPPING}={})
		{
			SC.rs.all(this,["_step","moveRight","moveLeft","moveDown","moveUp"]);

			this.mega(controllerMapping);

			this.columns=1;
			this.data=data;
			this.mapper=mapper;

			this.active=active;

			this.domElement=document.createElement("DIV");
			this.domElement.classList.add("Component","List");

			this.setColumns(columns);

			this.movement={
				method:null,
				timer:null,
				currentTime:Component.INITIAL_MOVEMENT_TIMEOUT
			}

			this.update();
		},
		update()
		{
			while(this.domElement.firstChild) this.domElement.removeChild(this.domElement.firstChild);

			this.active=Math.min(Math.max(this.active,0),this.data.length);

			for(let index=0;index<this.data.length;index++)
			{
				let element=document.createElement("DIV");
				this.mapper(element,this.data[index]);
				element.dataset.index=index;
				if(this.active===index) element.classList.add("active");
				this.domElement.appendChild(element);
			}
			return this;
		},
		setData(data=[])
		{
			this.data=data;
			return this;
		},
		setMapper(mapper=Component.STD_MAPPER)
		{
			this.mapper=mapper;
			return this;
		},
		setColumns(columns)
		{
			this.columns=Math.max(columns,1);
			this.domElement.style.setProperty("--list-columns",this.columns);
		},
		actions:{
			move(stick)
			{
				let absX=Math.abs(stick.x);
				let absY=Math.abs(stick.y);

				let method;
				if(absX<33&&absY<33)
				{
					this._stopMovement();
					return;
				}
				else if(absX>=absY)
				{
					method=stick.x<0?this.moveLeft:this.moveRight;
				}
				else
				{
					method=stick.y<0?this.moveDown:this.moveUp;
				}

				if(method!=this.movement.method)
				{
					this._stopMovement();
					this.movement.method=method;
					this._step();
				}
			}
		},
		_stopMovement()
		{
			clearTimeout(this.movement.timer);
			this.movement.method=null;
			this.movement.currentTime=Component.INITIAL_MOVEMENT_TIMEOUT;
		},
		moveRight()
		{
			this.domElement.children[this.active].classList.remove("active");

			this.active=(this.active+1)%this.data.length;

			this.domElement.children[this.active].classList.add("active");
		},
		moveLeft()
		{
			this.domElement.children[this.active].classList.remove("active");

			if(this.active<=0)this.active=this.data.length;
			this.active--;

			this.domElement.children[this.active].classList.add("active");
		},
		moveDown()
		{
			this.domElement.children[this.active].classList.remove("active");

			if(this.active+this.columns>=this.data.length) this.active=this.active%this.columns;
			else this.active+=this.columns;

			this.domElement.children[this.active].classList.add("active");
		},
		moveUp()
		{
			this.domElement.children[this.active].classList.remove("active");

			if(this.active-this.columns<0)
			{
				let fullList=this.columns*Math.ceil(this.data.length/this.columns);
				this.active=fullList-(this.columns-this.active);
				if(this.active>=this.data.length) this.active-=this.columns;

			}
			else this.active-=this.columns;

			this.domElement.children[this.active].classList.add("active");
		},
		_step()
		{
			this.movement.method.call(this);
			this.movement.timer=setTimeout(this._step,this.movement.currentTime);
			this.movement.currentTime=Math.max(Component.MIN_MOVEMENT_TIMEOUT,this.movement.currentTime/Component.MOVEMENT_ACCELERATION);
		}
	});

	Component.STD_MAPPER=(e,d)=>e.textContent=d;
	Component.STD_CONTROLLER_MAPPING=new Map([[null,{
		"stick":{
			"null":"move"
		}
	}]]);
	Component.INITIAL_MOVEMENT_TIMEOUT=800;
	Component.MIN_MOVEMENT_TIMEOUT=125;
	Component.MOVEMENT_ACCELERATION=1.2;

	SMOD("gs.Component.List",Component.List);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

    let gs=µ.gs=µ.gs||{};

	//SC=SC({});

	gs.Button=µ.Class({
		constructor:function({value=0,threshold=50}={})
		{
			this.value=0;
			this.threshold=50;

			this.setValue(value);
			this.setThreshold(threshold);
		},
		setThreshold(threshold=50)
		{
			this.threshold=Math.min(Math.max(threshold,0),100);
		},
        setValue(value=0)
        {
        	if(value==null) return false;
        	value=Math.min(Math.max(value,0),100);
        	if(this.value==value) return false;
        	this.value=value;
        	return true;
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
		},
		toJSON()
		{
			return {
				threshold:this.threshold
			};
		}
	});

	gs.Button.fromJSON=function(json)
	{
		return new gs.Button(json);
	};

	SMOD("gs.Button",gs.Button);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
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
//# sourceMappingURL=MorgasGS-0.8.3.js.map