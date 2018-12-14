(function(µ,SMOD,GMOD,HMOD,SC)
{
	SC=SC({
		list:"gs.Comp.List"
	});

	ResourceWar=µ.Class(µ.gs.Game,{
		name:"ResourceWar",
		constructor:function(maps)
		{
			this.mega();
			this.maps=maps;
			this.menu=new SC.list(this.maps,(e,d)=>e.textContent=d.name,{columns:1});
			this.domElement.appendChild(this.menu.domElement);
			this.map=null;
			this.analyzer=new µ.gs.Controller.Analyzer();
		},
		onControllerChange(event)
		{
			if(this.map) this.map.consumeControllerChange(event);
			else if (!this.menu.consumeControllerChange(event)&&event.type==="button")
			{
				let analysis=this.analyzer.analyze(event);
				if(analysis.pressed&&analysis.pressChanged)
				{// accept button pressed
					this.map=new ResourceWar.Map();
					this.menu.domElement.remove();
					this.map.loadLevel(this.maps[this.menu.active].file)
					.then(()=>
					{
						this.domElement.appendChild(this.map.domElement);
						this.map.setPause(this.pause)
					},µ.logger.error);
				}
			}
		},
		setPause(value)
		{
			this.mega(value);
			if(this.map) this.map.setPause(value);
		}
	});

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
