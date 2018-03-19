(function(µ,SMOD,GMOD,HMOD,SC){

	let Game=GMOD("gs.Game");

	SC=SC({
		rescope:"rescope",
		Keyboard:"gs.Controller.Keyboard",
		Gamepad:"gs.Controller.Gamepad",
	});

	Game.ControllerConfig=µ.Class(Game,{
		name:"ControllerConfig",
		constructor:function({
			onExit=null,
			buttons=6,
			sticks=1,
			axes=0
		}={})
    	{
			SC.rescope.all(this,["onAction"]);
    		this.mega();

    		this.onExit=onExit;

    		this.templateCounts={
				buttons:buttons,
				sticks:sticks,
				axes:axes
			};

			this.main=document.createElement("DIV");
			this.main.classList.add("main");
			this.domElement.appendChild(this.main);

    		this.menu=document.createElement("DIV");
    		this.menu.classList.add("menu");
    		this.menu.innerHTML=`
    			<div class="addController" tabindex="-1">
    				<span title="add">➕</span>
    				<div>
    					<div data-action="addGamepad" title="Gamepad">🎮</div>
    					<div data-action="addKeyboard" title="Keyboard">⌨</div>
    				</div>
    			</div>
    			<div data-action="mapping" title="Mapping">⚙</div>
    			<div data-action="setting" title="Setting">🔧</div>
    			<div data-action="remove" title="Remove">➖</div>
    			<div data-action="exit" title="Exit">🚪</div>
    		`;
    		this.menu.addEventListener("click",this.onAction);
    		this.main.appendChild(this.menu);

    		this.controllerIcons=new Map([
				[SC.Keyboard.prototype.constructor,"⌨"],
				[SC.Gamepad.prototype.constructor,"🎮"],
			]);

    		this.list=document.createElement("DIV");
    		this.list.classList.add("list");
    		this.main.appendChild(this.list);
    		this.controllerMap=new Map();
    	},
    	setPause(value)
    	{
    		this.mega(value);
    		if(!this.pause) this.updateSystem();
    	},
    	updateSystem()
    	{
    		this.controllerMap.clear();
    		while(this.list.lastChild) this.list.lastChild.remove();

    		let counter=0;
    		for(let controller of this.system.controllers)
    		{
    			let element=document.createElement("LABEL");
    			element.innerHTML=`
    				<input type="radio" name="ControllerConfig-list">
    				<div>${this.controllerIcons.get(controller.constructor)||"⁈"}</div>
    				<div>test ${++counter}
    			`;
    			this.controllerMap.set(element,controller);
    			this.controllerMap.set(controller,element);
    			this.list.appendChild(element);
    		}
    	},
    	onAction(event)
		{
			let selected;
			let controller;
			switch(event.target.dataset.action)
			{
				case "addGamepad":
					this.selectGamepad()
					.then(newGameCon=>{
						this.system.addController(newGameCon);
						this.mapGamepad(newGameCon);
					});
					break;
				case "addKeyboard":
					let newKeyCon=new SC.Keyboard();
					this.system.addController(newKeyCon);
					controllerConfig.mapKeyboard(newKeyCon);
					break;
				case "mapping":
					selected=this.list.querySelector(":checked").parentNode;
					controller=this.controllerMap.get(selected);
					if(!controller) return ;

					switch(controller.constructor)
					{
						case SC.Keyboard.prototype.constructor:
							this.mapKeyboard(controller);
							break;
						case SC.Gamepad.prototype.constructor:
							this.mapGamepad(controller);
							break;
						default:
							µ.logger.error("#ControllerConfig:001 unknown controller class")
							//TODO
					}

					break;
				case "setting":
					selected=this.list.querySelector(":checked");
					if(!selected) return ;
					controller=this.controllerMap.get(selected.parentNode);
					if(!controller) return ;

					this.setting(controller);

					break;
				case "remove":
					selected=this.list.querySelector(":checked");
					if(!selected) return ;
					controller=this.controllerMap.get(selected.parentNode);
					this.system.removeController(controller);
					this.updateSystem();
					break;
				case "exit":
					if(this.onExit) this.onExit();
					break;
			}
		},
		selectGamepad()
		{
			return new Promise((resolve,reject)=>
			{
				let chooseContainer=document.createElement("DIV");
				chooseContainer.classList.add("selectGamepad");

				let gamepads;
				let updateChoice=()=>
				{
					gamepads=navigator.getGamepads();
					for(let controller of this.system.controllers)
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
					chooseContainer.children[0].focus();
				};
				window.addEventListener("gamepadconnected",updateChoice);
				this.domElement.appendChild(chooseContainer);
				this.domElement.classList.add("block");
				updateChoice();

				chooseContainer.addEventListener("click",(event)=>
				{
					switch(event.target.dataset.action)
					{
						case "cancel":
							window.removeEventListener("gamepadconnected",updateChoice);
							this.domElement.classList.remove("block");
							chooseContainer.remove();
							reject();
							break;
						case "ok":
							let select=chooseContainer.children[0];
							let gamepad=gamepads[select.value]
							if(gamepad)
							{
								window.removeEventListener("gamepadconnected",updateChoice);
								this.domElement.classList.remove("block");
								chooseContainer.remove();
								resolve(new SC.Gamepad(gamepad));
							}
							break;
					}
				});
			});
		},
		getMappingTemplate()
		{
			let template={
				domElement:document.createElement("DIV"),
				buttons:{
					domElement:document.createElement("FIELDSET"),
				},
				sticks:{
					domElement:document.createElement("FIELDSET"),
				},
				axes:{
					domElement:document.createElement("FIELDSET"),
				}
			};

			template.domElement.classList.add("edit");
			template.domElement.appendChild(template.buttons.domElement);

			template.buttons.domElement.classList.add("buttons");
			let legend=document.createElement("LEGEND");
			legend.textContent="Buttons";
			template.buttons.domElement.appendChild(legend);
			if(this.templateCounts.buttons==0)
			{
				template.buttons.domElement.classList.add("empty");
			}
			else for(let i=0;i<this.templateCounts.buttons;i++)
			{
				let buttonTemplate=template.buttons[i]={};
				buttonTemplate.domElement=document.createElement("DIV");
				buttonTemplate.domElement.dataset.type="button";
				buttonTemplate.domElement.dataset.index=i;
				template.buttons.domElement.append(buttonTemplate.domElement);

				buttonTemplate.input=document.createElement("INPUT");
				buttonTemplate.domElement.appendChild(buttonTemplate.input);

				buttonTemplate.description=document.createElement("SPAN");
				buttonTemplate.description.textContent=i;
				buttonTemplate.domElement.appendChild(buttonTemplate.description);
			}

			template.axes.domElement.classList.add("axes");
			template.domElement.appendChild(template.axes.domElement);
			legend=document.createElement("LEGEND");
			legend.textContent="Axes";
			template.axes.domElement.appendChild(legend);
			if(this.templateCounts.axes==0)
			{
				template.axes.domElement.classList.add("empty");
			}
			else for(let i=0;i<this.templateCounts.axes;i++)
			{
				let axisTemplate=template.axes[i]={};
				axisTemplate.domElement=document.createElement("DIV");
				axisTemplate.domElement.dataset.type="axis";
				axisTemplate.domElement.dataset.index=i;
				template.axes.domElement.append(axisTemplate.domElement);

				axisTemplate.input=document.createElement("INPUT");
				axisTemplate.domElement.appendChild(axisTemplate.input);

				axisTemplate.description=document.createElement("SPAN");
				axisTemplate.description.textContent=i;
				axisTemplate.domElement.appendChild(axisTemplate.description);
			}

			template.sticks.domElement.classList.add("sticks");
			template.domElement.appendChild(template.sticks.domElement);
			legend=document.createElement("LEGEND");
			legend.textContent="Sticks";
			template.sticks.domElement.appendChild(legend);
			if(this.templateCounts.sticks==0)
			{
				template.sticks.domElement.classList.add("empty");
			}
			else for(let i=0;i<this.templateCounts.sticks;i++)
			{
				let stickTemplate=template.buttons[i]={};
				stickTemplate.domElement=document.createElement("DIV");
				stickTemplate.domElement.dataset.type="stick";
				stickTemplate.domElement.dataset.index=i;
				template.sticks.domElement.append(stickTemplate.domElement);

				let axesWrapper=document.createElement("DIV");
				stickTemplate.domElement.append(axesWrapper);

				let descX=document.createElement("SPAN");
				descX.textContent="X:";
				axesWrapper.appendChild(descX);
				stickTemplate.inputX=document.createElement("INPUT");
				stickTemplate.inputX.dataset.axis="x";
				axesWrapper.appendChild(stickTemplate.inputX);

				let descY=document.createElement("SPAN");
				descY.textContent="Y:";
				axesWrapper.appendChild(descY);
				stickTemplate.inputY=document.createElement("INPUT");
				stickTemplate.inputY.dataset.axis="y";
				axesWrapper.appendChild(stickTemplate.inputY);

				stickTemplate.description=document.createElement("SPAN");
				stickTemplate.description.textContent=i;
				stickTemplate.domElement.appendChild(stickTemplate.description);
			}

    		template.okBtn=document.createElement("BUTTON");
    		template.okBtn.classList.add("okButton");
    		template.okBtn.textContent="OK";
    		template.domElement.appendChild(template.okBtn);

			return template;
		},
		mapKeyboard(controller)
		{
			let template=this.getMappingTemplate();
			this.domElement.removeChild(this.main);
			this.domElement.appendChild(template.domElement);

			template.domElement.addEventListener("keydown",function(event)
			{
				//TODO ignore tab,meta and F1-N keys
				console.log(event.code);
				let target=template.domElement.querySelector(":focus");
				if(target&&target.tagName==="INPUT")
				{
					event.preventDefault();
					let item=this.getItem(target);
					if(item)
					{
						switch(item.dataset.type)
						{
							case "button":
									target.value=event.code;
									controller.associateButton(event.code,item.dataset.index);
							case "axis":
									target.value=event.code;
									//TODO negative
									controller.associateButton(event.code,item.dataset.index);
								break;
							case "stick":
									target.value=event.code;
									//TODO negative
									controller.associateStick(event.code,item.dataset.index,target.dataset.axis);
								break;
							default:
								µ.logger.error("#ControllerConfig:004 unexpected item type");
						}
					}
				}
			});

			template.okBtn.addEventListener("click",()=>
			{
				clearInterval(inspectInterval);
				this.domElement.removeChild(template.domElement);
				this.updateSystem();
				this.domElement.appendChild(this.main);
			});
		},
		mapGamepad(controller)
		{
			let inspectController=new SC.Gamepad(controller.gamepad);
			let template=this.getMappingTemplate();
			this.domElement.removeChild(this.main);
			this.domElement.appendChild(template.domElement);

			inspectController.addEventListener("controllerChange",this,function(event)
			{
				if(
					((event.type==="button"||event.type==="axis")&&Math.abs(event.value.value)<50) ||
					(event.type==="stick"&&(Math.abs(event.value.x)<50||Math.abs(event.value.y)<50))
				)
				{
					return;
				}
				let target=template.domElement.querySelector(":focus");
				if(target&&target.tagName==="INPUT")
				{
					let item=this.getItem(target);
					if(item)
					{
						switch(event.type)
						{
							case "button":
								if(item.dataset.type=="button")
								{
									target.value=event.index;
									controller.associateButton(event.index,item.dataset.index);
								}
								break;
							case "axis":
								if(item.dataset.type=="axis")
								{
									target.value=event.index;
									controller.associateAxis(event.index,item.dataset.index);
								}
								else if(item.dataset.type=="stick")
								{
									target.value=event.index;
									controller.associateStick(event.index,item.dataset.index,target.dataset.axis);
								}
								break;
							default:
								µ.logger.error("#ControllerConfig:003 unexpected controllerEvent type");
						}
					}
				}
			});

			let inspectInterval=setInterval(()=>inspectController.update(),100);
			template.okBtn.addEventListener("click",()=>
			{
				clearInterval(inspectInterval);
				inspectController.removeEventListener("controllerChange",this);
				inspectController.destroy();
				this.domElement.removeChild(template.domElement);
				this.updateSystem();
				this.domElement.appendChild(this.main);
			});
		},
		getItem(item)
		{
			while(item&&!item.dataset.type) item=item.parentNode;
			if(!item)
			{
				µ.logger.error("#ControllerConfig:002 item not found");
				return null;
			}
			return item;
		},
		setting(controller)
		{
			//TODO
		}
	});

	SMOD("gs.Game.ControllerConfig",Game.ControllerConfig);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);