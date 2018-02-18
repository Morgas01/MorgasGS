(function(µ,SMOD,GMOD,HMOD,SC){

	let Game=GMOD("gs.Game");

	SC=SC({
		rescope:"rescope",
		ControllerConfig:"gs.Game.ControllerConfig"
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

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);