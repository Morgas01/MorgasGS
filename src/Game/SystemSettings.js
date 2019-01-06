(function(µ,SMOD,GMOD,HMOD,SC){

	let Game=GMOD("gs.Game");

	SC=SC({
		ControllerConfig:"gs.Panel.ControllerConfig",
		List:"gs.Comp.List",
		proxy:"proxy"
	});

	/** this "Game" shows and configures all settigs of the System it is loaded into */
	Game.SystemSettings=µ.Class(Game,{
		name:"SystemSettings",
		constructor:function(onExit,controllerConfigParam={})
		{
			this.mega();

			this.onExit=onExit;
			this.controllerConfigParam=controllerConfigParam;
			this.content=this.list=new SC.List(["Controller Config","Exit"]);
			this.list.addEventListener("gs.Select",this,this.onSelect);

			SC.proxy("content",[["consumeControllerChange","onControllerChange"]],this)

			this.domElement.appendChild(this.content.domElement);
		},
		onSelect(event)
		{
			switch(event.data)
			{
				case "Controller Config":
					this.switchContent(event.data);
					break;
				case "Exit":
					if(this.onExit) this.onExit();
					return;
			}
		},
		switchContent(name)
		{
			if(this.content!=this.list) this.content.destroy();
			else this.content.domElement.remove();

			switch(name)
			{
				default:
				case "list":
					this.content=this.list;
					break;
				case "Controller Config":
					this.content=new SC.ControllerConfig(this.system,{
						...this.controllerConfigParam,
						onExit:()=>this.switchContent("list")
					});
					break;
			}
			this.domElement.appendChild(this.content.domElement);
		}
	});

	SMOD("gs.Game.SystemSettings",Game.SystemSettings);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);