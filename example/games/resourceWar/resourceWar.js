(function(µ,SMOD,GMOD,HMOD,SC)
{
	//SC=SC({});

	ResourceWar=µ.Class(µ.gs.Game,{
		name:"ResourceWar",
		constructor:function(maps)
		{
			this.mega();
			this.maps=maps;
			this.menu=new µ.gs.Component.List(this.maps,(e,d)=>e.textContent=d.name,{columns:1});
			this.menu.domElement.classList.add("levelMenu");
			this.domElement.appendChild(this.menu.domElement);
			this.analyzer=new µ.gs.Controller.Analyzer();
			this.map=null;
			this.mapEndScreen=null;

			this.menu.addEventListener("gs.Select",this,this.loadSelectedLevel);
		},
		onControllerChange(event)
		{
			if(this.mapEndScreen) this.mapEndScreen.consumeControllerChange(event)
			else if(this.map) this.map.consumeControllerChange(event);
			else this.menu.consumeControllerChange(event);
		},
		loadSelectedLevel()
		{
			this.menu.domElement.remove();
			if(!this.map)
			{
				this.map=new ResourceWar.Map();
				this.map.addEventListener("mapStop",this,this.onMapStop);
			}

			this.map.loadLevel(this.maps[this.menu.active].file)
			.then(()=>
			{
				this.domElement.appendChild(this.map.domElement);
				this.map.setPause(this.pause)
			},µ.logger.error);
		},
		setPause(value)
		{
			this.mega(value);
			if(this.map) this.map.setPause(value);
		},
		onMapStop(event)
		{
			this.mapEndScreen=new ResourceWar.MapEndScreen(event.winner===1);
			this.mapEndScreen.addEventListener("gs.Select",this,this.onMapEndSelect);
			this.domElement.appendChild(this.mapEndScreen.domElement);
		},
		onMapEndSelect(event)
		{
			this.mapEndScreen=this.mapEndScreen.destroy();

			//TODO reuse map
			this.map=this.map.destroy();
			switch (event.data)
			{
				case "next":
					this.menu.moveRight();
				case "retry":
					this.loadSelectedLevel();
					break;
				case "menu":
					this.domElement.appendChild(this.menu.domElement);
			}
		}
	});

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
