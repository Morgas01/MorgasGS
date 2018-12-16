(function(µ,SMOD,GMOD,HMOD,SC)
{
	//SC=SC({});

	ResourceWar.Generator=µ.Class(µ.gs.Component.Course.Svg.Item,{
		generatorID:0,
		constructor:function(param={})
		{
			this.generatorID=ResourceWar.Generator.prototype.generatorID++;

			param.name="generator";

			this.mega(param);

			this.element.classList.add("generator");
			this.element.dataset.id=this.generatorID;
			this.element.innerHTML=
	`
	<use href="#generator"/>
	<text y="1.8em"/>
	`;
			this.text=this.element.children[1];

			for(let attr of ["team","resources","generation","max"])
			{
				let val=null; // prevent string conversion
				Object.defineProperty(this,attr,{
					get:()=>val,
					set:(t)=>val=this.element.dataset[attr]=t
				});
			}
			({
				team:this.team=null,
				resources:this.resources=0,
				/**
				 * amout of resources pro generation
				 * @type {number}
				 */
				generation:this.generation=1,
				/**
				 * time between generations
				 * @type {number}
				 */
				generationRate:this.generationRate=2000,
				/**
				 * minimum time between generations
				 * @type {number}
				 */
				generationMinRate:this.generationMinRate=this.generationRate/4,
				/**
				 * amount of time adjustment for generation when receiving a package
				 * @type {Number}
				 */
				generationTimeAdjust:this.generationTimeAdjust=(this.generationRate-this.generationMinRate)/5,
				/**
				 * max resources
				 * @type {number}
				 */
				max:this.max=100,
				/**
				 * min resources to create packages
				 * @type {number}
				 */
				min:this.min=5,

				packageRate:this.packageRate=1000,
				packageRatio:this.packageRatio=0.1,
				packageSpeed:this.packageSpeed=30,
				packageSpeedFraction:this.packageSpeedFraction=0.5
			}=param);

			this.lastGenerationTime=0;
			this.nextGenerationTime=0;
			this.nextPackageTime=0;
			this.target=null;

			this.update();
		},
		update()
		{
			this.mega();
			let textPos;
			if(this.resources<10)
			{
				textPos="1.2em";
			}
			else if(this.resources<100)
			{
				textPos=".9em";
			}
			else
			{
				textPos=".6em";
			}
			this.text.setAttribute("x",textPos);
			this.text.textContent=this.resources;
		},
		setTarget(target)
		{
			if(this.target!==target&&target!==this)
			{
				this.target=target;
			}
			else
			{
				this.target=null;
			}
		},
		generate()
		{
			if(this.team!=null&&this.resources<this.max)
			{
				this.resources+=Math.min(this.generation,this.max-this.resources);
				this.lastGenerationTime=this.nextGenerationTime;
				this.nextGenerationTime+=this.generationRate;
				this.update();
			}
		},
		canFirePackage()
		{
			return this.resources>this.min;
		},
		createPackage(map,target)
		{
			if(this.canFirePackage())
			{
				let packageResources=Math.ceil(this.resources*this.packageRatio);
				let speed=Math.max(10,this.packageSpeed-packageResources*this.packageSpeedFraction);
				this.resources-=packageResources;
				let packageItem=new ResourceWar.Package({
					generator:this,
					target:target,
					speed:speed,
					resources:packageResources,
					attack:packageResources
				});
				this.update();
				map.addPackage(packageItem);
			}
		},
		receivePackage(map,packageItem)
		{
			if(this.team===packageItem.team)
			{
				this.resources+=packageItem.resources;
			}
			else
			{
				this.resources-=packageItem.attack;
				if(this.resources<=0)
				{
					let oldTeam=this.team;
					this.resources=-this.resources;
					this.team=packageItem.team;
					this.setTarget(null);
					this.nextGenerationTime=map.time+this.generationRate;
					map.checkWin(oldTeam,this.team);
				}
			}
			this.adjustGenerationTime(packageItem.team);
			this.update();
			map.removePackage(packageItem);
		},
		adjustGenerationTime(team)
		{
			if(team!==this.team) this.nextGenerationTime+=this.generationTimeAdjust;
			else
			{
				this.nextGenerationTime-=this.generationTimeAdjust;
				if(this.nextGenerationTime-this.lastGenerationTime<this.generationMinRate)
				{
					this.nextGenerationTime=this.lastGenerationTime+this.generationMinRate;
				}
			}
		},
		action(map,timeDiff)
		{
			if(this.nextGenerationTime<map.time)
			{
				this.generate();
			}

			//TODO find team overrideTarget
			let target=this.target;
			if(this.team===map.players[0].team&&map.players[0].overrideTarget&&map.players[0].active!==this)
			{
				target=map.players[0].active;
			}

			if(this.nextPackageTime<map.time&&target!=null&&this.canFirePackage())
			{
				this.createPackage(map,target);
				if(this.nextPackageTime+this.packageRate<map.time)
				{
					this.nextPackageTime=map.time+this.packageRate;
				}
				this.nextPackageTime+=this.packageRate;
			}
		}
	});

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
