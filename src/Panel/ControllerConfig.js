(function(µ,SMOD,GMOD,HMOD,SC){

	let Panel=GMOD("gs.Panel");

	SC=SC({
		List:"gs.Comp.List",
		repeat:"array.repeat",

		Keyboard:"gs.Con.Keyboard",
		Gamepad:"gs.Con.Gamepad",

		Button:"gs.Button",
		Axis:"gs.Axis",
		Stick:"gs.Stick",

		ControllerStatus:"gs.Comp.ControllerStatus"
	});

	/** this Component lists and configures all Controller on the System */
	Panel.ControllerConfig=µ.Class(Panel,{
		constructor:function(system,{
			onExit=null,
			buttons=6,
			axes=0,
			sticks=1
		}={})
    	{
    		if(!system) throw new TypeError("#ControllerConfig:001 no system provided");

    		this.mega();

    		this.onExit=onExit;
    		this.system=system;

			this.buttonCount=buttons;
			this.stickCount=sticks;
			this.axisCount=axes;

			this.domElement=document.createElement("DIV");
			this.domElement.classList.add("Panel","ControllerConfig");

			this.main=document.createElement("DIV");
			this.main.classList.add("main");
			this.domElement.appendChild(this.main);

    		this.actionMenu=new SC.List([
    			{
    				symbol:"➕",
    				action:"add"
    			},
    			{
    				symbol:"🔧",
    				action:"edit"
    			},
    			{
    				symbol:"⚙",
    				action:"precision"
    			},
    			{
    				symbol:"➖",
    				action:"remove"
    			},
    			{
    				symbol:"🚪",
    				action:"exit"
    			}
    		],
    		actionMenuMapper,
    		{
    			columns:5
    		});
    		this.actionMenu.addEventListener("gs.Select",this,this.onAction);

    		this.actionMenu.domElement.classList.add("actionMenu");
    		this.main.appendChild(this.actionMenu.domElement);

    		this.controllers=[];
			this.controllerList=new SC.List(this.controllers,controllerListMapper);
    		this.controllerList.domElement.classList.add("controllerList");
    		this.controllerList.addEventListener("gs.Select",this,function(event)
    		{
    			this.controllerList.setActive(event.index);
    		});
    		this.main.appendChild(this.controllerList.domElement);

    		this.updateSystem();
    	},
    	setPause(value)
    	{
    		this.mega(value);
    		if(!this.pause) this.updateSystem();
    	},
    	updateSystem()
    	{
			this.controllers.length=0;
			this.controllers.push(...this.system.controllers);
			this.controllerList.update();
    	},
    	onAction(event)
		{
			let selected;
			let controller;
			switch(event.data.action)
			{
				case "add":
					this.selectGamepad()
					.then(newGameCon=>{
						this.system.addController(newGameCon);
						this.updateSystem();
					});
					break;
				case "edit":
				/*
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
				*/
					break;
				case "precision":
					let controllerStatus=new SC.ControllerStatus({
						[this.controllerList.getActiveData().ID]:{
							action:"show"
						}
					});
					this.domElement.appendChild(controllerStatus.domElement);
					this.domElement.classList.add("subScreen");
					this.addComponent(controllerStatus);

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
				chooseContainer.innerHTML=`<div class="gamepad-hint">press any button to activate gamepad</div>`;

				let choices=["cancel","keyboard"];
				let chooseList=new SC.List(choices,function(e,gamepad,index)
				{
					if(index<=1) e.textContent=gamepad;
					else e.textContent=gamepad.id;
				});
				this.addComponent(chooseList);
				chooseContainer.appendChild(chooseList.domElement);
				let updateChoice=()=>
				{
					choices.length=2;

					let gamepads=navigator.getGamepads();
					for(let controller of this.system.controllers)
					{
						if(controller instanceof SC.Gamepad)
						{
							gamepads[controller.gamepad.index]=null;
						}
					}
					choices.push(...gamepads.filter(µ.constantFunctions.pass));
					chooseList.update();
				};
				window.addEventListener("gamepadconnected",updateChoice);
				updateChoice();
				this.domElement.appendChild(chooseContainer);
				this.domElement.classList.add("subScreen");

				chooseList.addEventListener("gs.Select",this,function(event)
				{
					chooseContainer.remove();
					chooseList.destroy();
					this.removeComponent(chooseList);
					window.removeEventListener("gamepadconnected",updateChoice);

					switch(event.data)
					{
						case "cancel":
							reject();
							break;
						case "keyboard":
							resolve(new SC.Keyboard({
								buttons:SC.repeat(this.buttonCount,()=>new SC.Button()),
								axes:SC.repeat(this.axisCount,()=>new SC.Axis()),
								sticks:SC.repeat(this.stickCount,()=>new SC.Stick()),
							}));
							break;
						default:
							resolve(new SC.Gamepad(event.data));
							break;
					}
					this.domElement.classList.remove("subScreen");
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
		destroy()
		{
			this.domElement.remove();
			this.mega();
		}
	});

	let controllerListMapper=function(element,controller)
	{
		switch(controller.constructor)
		{
			case SC.Keyboard.prototype.constructor:
				element.textContent="⌨\tKeyboard";
				break;
			case SC.Gamepad.prototype.constructor:
				element.textContent="🎮\t"+controller.gamepad.id;
				break;
			default:
				element.textContent="?\tUnknown";
				µ.logger.error("#ControllerConfig:001 unknown controller class");
		}
	};
	let actionMenuMapper=function(element,data)
	{
		element.textContent=data.symbol;
		element.title=data.action
	};

	SMOD("gs.Panel.ControllerConfig",Panel.ControllerConfig);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);