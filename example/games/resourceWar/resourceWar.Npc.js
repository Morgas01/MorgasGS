(function(µ,SMOD,GMOD,HMOD,SC)
{
	//SC=SC({});

	ResourceWar.Npc=µ.Class({
		constructor:function({team,delay=3000,interval=2000}={})
		{
			this.team=team;
			this.interval=interval;
			this.nextActionTime=delay;
		},
		action(map,timeDiff)
		{
			if(this.nextActionTime>map.time) return;

			this.nextActionTime+=this.interval;
			let myBiggest=null;
			let easyTarget=null;
			for (let generator of map.generators)
			{
				if(generator.team===this.team)
				{
					if(generator.target!=null)
					{
						if(generator.target.team===this.team) generator.setTarget(null);
						else continue;
					}

					if(!myBiggest||myBiggest.resources<generator.resources)
					{
						myBiggest=generator;
					}
				}
				else if(!easyTarget||easyTarget.team!=null&&generator.team==null||easyTarget.resources>generator.resources)
				{
					easyTarget=generator;
				}
			}
			if(myBiggest&&easyTarget) myBiggest.setTarget(easyTarget);
		}
	});

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
