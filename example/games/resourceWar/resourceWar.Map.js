(function(µ,SMOD,GMOD,HMOD,SC)
{
	SC=SC({
		rq:"request",
		remove:"array.remove"
	});

	ResourceWar.Map=µ.Class(µ.gs.Component,{
		constructor:function({controllerMappings=ResourceWar.Map.SINGLE_CONTROLLER_MAPPING}={})
		{
			µ.util.function.rescope.all(this,["loop"]);
			this.mega(controllerMappings);

			this.time=0;
			this.end=false;// game ended
			this.pause=true;
			this.course=new µ.gs.Component.Course.Svg();
			this.domElement=this.course.domElement;
			this._createSymbols();
			this.generators=[];
			this.packages=[];

			this.loopId=null;
			this.lastTime=null;

			this.players=[new ResourceWar.Player({team:1,map:this})];
			this.npcs=[];
			this.teamGeneratorCounts={};
		},
		setPause(value)
		{
			this.pause=!!value||this.end;
			if(this.pause)
			{
				cancelAnimationFrame(this.loopId);
				this.lastTime=null;
			}
			else this.loop();
		},
		_createSymbols()
		{
			let generatorSymbol=µ.gs.Component.Course.Svg.createElement("symbol",{id:"generator"});
			generatorSymbol.innerHTML=
	`
	<circle r="3" cx="3" cy="3" class="generator-outer"></circle>
	<circle r="1.5" cx="3" cy="3" class="generator-inner"></circle>
	`		;
			this.course.domElement.appendChild(generatorSymbol);
			let cursorSymbol=µ.gs.Component.Course.Svg.createElement("symbol",{id:"cursor"});
			cursorSymbol.innerHTML=
	`
	<circle r="2.8" cx="3" cy="3" class="cursor">
		<animate attributeName="r" dur="2" values="2.8;1.4;2.8" repeatCount="indefinite" keyTimes="0;.75;1"></animate>
	</circle>
	`		;
			this.course.domElement.appendChild(cursorSymbol);
		},
		loadLevel(name)
		{
			return SC.rq.json("resourceWar/maps/"+name+".json")
			.then(json=>
			{
				let firstActive=null;
				let otherTeams=new Set();
				for(let generatorJson of json.generators)
				{
					generatorJson.course=this.course;
					let item=new ResourceWar.Generator(generatorJson);
					if(item.team===1)
					{
						firstActive=item;
						if(!this.teamGeneratorCounts[item.team])this.teamGeneratorCounts[item.team]=0;
						this.teamGeneratorCounts[item.team]++;
					}
					else if (item.team!=null)
					{
						otherTeams.add(item.team);
						if(!this.teamGeneratorCounts[item.team])this.teamGeneratorCounts[item.team]=0;
						this.teamGeneratorCounts[item.team]++;
					}
					this.generators.push(item);
				}
				this.course.addItems(this.generators);

				//TODO players
				this.course.addItem(this.players[0].cursor);
				this.players[0].setActive(firstActive);
				for (let team of otherTeams)
				{
					this.npcs.push(new ResourceWar.Npc({team:team}));
				}
				return this;
			});
		},
		actions:{
			playerAction(event,index)
			{
				this.players[index].consumeControllerChange(event);
			}
		},
		loop(timeNow)
		{
			cancelAnimationFrame(this.loopId); //prevent simultaneous calls
			this.loopId=requestAnimationFrame(this.loop);
			if(!this.lastTime)
			{
				this.lastTime=timeNow;
				return;
			}
			let timeDiff=timeNow-this.lastTime;
			if(timeDiff>250) timeDiff=250; // no long jumps
			this.lastTime=timeNow;
			this.time+=timeDiff;

			for(let pack of this.packages)
			{
				pack.action(this,timeDiff);
			}
			for(let npc of this.npcs)
			{
				npc.action(this,timeDiff);
			}
			for(let generator of this.generators)
			{
				generator.action(this,timeDiff);
			}
		},
		addPackage(packageItem)
		{
			this.packages.push(packageItem);
			this.course.addItem(packageItem);
		},
		removePackage(packageItem)
		{
			this.course.removeItem(packageItem);
			SC.remove(this.packages,packageItem);
			packageItem.destroy();
		},
		checkWin(oldTeam,newTeam)
		{
			this.teamGeneratorCounts[newTeam]++;
			if(oldTeam!==null)
			{
				this.teamGeneratorCounts[oldTeam]--;
				for(let [team,count] of Object.entries(this.teamGeneratorCounts))
				{
					if(count>0&&team!=newTeam) return;
				}
				//WIN
				this.setPause(this.end=true);

			}
		}
	});
	ResourceWar.Map.SINGLE_CONTROLLER_MAPPING={
		"*":{action:"playerAction",data:0}
	};

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
