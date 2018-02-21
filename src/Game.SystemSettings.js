(function(µ,SMOD,GMOD,HMOD,SC){

	let Game=GMOD("gs.Game");

	SC=SC({
		rescope:"rescope",
		ControllerConfig:"gs.Game.ControllerConfig"
	});

	Game.SystemSettings=µ.Class(Game,{
		name:"SystemSettings",
		constructor:function(onExit)
		{
			SC.rescope.all(this,["onAction"]);
			this.mega();
			this.onExit=onExit;
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
			let system=this.system;
			switch(event.target.dataset.action)
			{
				case "controllerConfig":
					system.setGame(new SC.ControllerConfig({
						onExit:()=>system.setGame(this)
					}));
					break;
				case "exit":
					if(this.onExit) this.onExit();
					return;
			}
		}
	});

	SMOD("gs.Game.SystemSettings",Game.SystemSettings);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);