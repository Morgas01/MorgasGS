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
    			<div data-action="edit" title="Edit">⚙</div>
    			<div data-action="remove" title="Remove">➖</div>
    			<div data-action="exit" title="Exit">🚪</div>
    		`;
    		this.menu.addEventListener("click",this.onAction);
    		this.domElement.appendChild(this.menu);

    		this.controllerIcons=new Map([
				[SC.Keyboard.prototype.constructor,"⌨"],
				[SC.Gamepad.prototype.constructor,"🎮"],
			]);

    		this.list=document.createElement("DIV");
    		this.list.classList.add("list");
    		this.domElement.appendChild(this.list);
    		this.controllerMap=new Map();

    		let okBtn=document.createElement("BUTTON");
    		okBtn.textContent="OK";
    		this.domElement.appendChild(okBtn);
    		/** TODO
			okBtn.addEventListener("click",()=>
			{
				fire event
			});
			*/
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
						this.editGamepad(newGameCon);
					});
					break;
				case "addKeyboard":
					let newKeyCon=new SC.Keyboard();
					this.system.addController(newKeyCon);
					controllerConfig.editKeyboard(newKeyCon);
					break;
				case "edit":
					selected=list.querySelector(":checked").parentNode;
					controller=controllerMap.get(selected);

					switch(controller.constructor)
					{
						case SC.Keyboard.prototype.constructor:
							this.editKeyboard(controller);
							break;
						case SC.Gamepad.prototype.constructor:
							this.editGamepad(controller);
							break;
						default:
							µ.logger.error("#ControllerConfig:001 unknown controller class")
							//TODO
					}

					break;
				case "remove":
					selected=list.querySelector(":checked").parentNode;
					controller=controllerMap.get(selected);
					this.system.removeController(controller);
					this.updateSystem();
					break;
				case "exit":
					if(this.onExit) this.onExit();
					return;
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
		getControllerTemplate()
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

			template.domElement.appendChild(template.buttons.domElement);
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
				buttonTemplate.domElement.classList.add("button");
				buttonTemplate.domElement.dataset.index=i;
				template.buttons.domElement.append(buttonTemplate.domElement);

				buttonTemplate.input=document.createElement("INPUT");
				template.buttons.domElement.appendChild(buttonTemplate.input);

				buttonTemplate.description=document.createElement("SPAN");
				buttonTemplate.description.textContent=i;
				template.buttons.domElement.appendChild(buttonTemplate.description);
			}

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
				axisTemplate.domElement.classList.add("axis");
				axisTemplate.domElement.dataset.index=i;
				template.axes.domElement.append(axisTemplate.domElement);

				axisTemplate.input=document.createElement("INPUT");
				template.axes.domElement.appendChild(axisTemplate.input);

				axisTemplate.description=document.createElement("SPAN");
				axisTemplate.description.textContent=i;
				template.axes.domElement.appendChild(axisTemplate.description);
			}

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
				stickTemplate.domElement.classList.add("button");
				stickTemplate.domElement.dataset.index=i;
				template.sticks.domElement.append(stickTemplate.domElement);

				stickTemplate.inputX=document.createElement("INPUT");
				template.sticks.domElement.appendChild(stickTemplate.inputX);

				stickTemplate.inputY=document.createElement("INPUT");
				template.sticks.domElement.appendChild(stickTemplate.inputY);

				stickTemplate.description=document.createElement("SPAN");
				stickTemplate.description.textContent=i;
				template.sticks.domElement.appendChild(stickTemplate.description);
			}

			return template;
		},
		editKeyboard(controller)
		{
			//TODO
		},
		editGamepad(controller)
		{
			//TODO
		}
	});

	SMOD("gs.Game.ControllerConfig",Game.ControllerConfig);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);