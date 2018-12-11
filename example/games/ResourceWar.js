
let SC=µ.shortcut({
	rs:"rescope",
	rq:"request",
	remove:"array.remove",
	list:"gs.Comp.List"
});

let ResourceWar=µ.Class(µ.gs.Game,{
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
ResourceWar.Map=µ.Class(µ.gs.Component,{
	constructor:function({controllerMappings=ResourceWar.Map.SINGLE_CONTROLLER_MAPPING}={})
	{
		µ.util.function.rescope.all(this,["loop"]);
		this.mega(controllerMappings);

		this.time=0;
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
	},
	setPause(value)
	{
		this.pause=!!value;
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
		return SC.rq.json("resourceWar_maps/"+name+".json")
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
				}
				else if (item.team!=null)
				{
					otherTeams.add(item.team);
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
	}
});
ResourceWar.Map.SINGLE_CONTROLLER_MAPPING={
	"*":{
		"*":{
			"*":{action:"playerAction",data:0}
		}
	}
};

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
				this.resources=-this.resources;
				this.team=packageItem.team;
				this.setTarget(null);
				this.nextGenerationTime=map.time+this.generationRate;
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
				this.nextPackageTime=map.time;
			}
			this.nextPackageTime+=this.packageRate;
		}
	}
});
ResourceWar.Package=µ.Class(µ.gs.Component.Course.Svg.Item,{
	constructor:function(param={})
	{
		let {
			generator,
			generator:{
				team=null,
				x,
				y
			},
			target,
			speed=20,
			resources,
			attack
		}=param;

		this.mega({
			name:"package",
			tagName:"circle",
			x,
			y
		});

		this.element.setAttribute("r",1+resources/8);
		this.element.setAttribute("cx","3");
		this.element.setAttribute("cy","3");

		this.element.classList.add("Package");

		this.target=target;

		for(let attr of ["team","resources"])
		{
			let val=null; // prevent string conversion
			Object.defineProperty(this,attr,{
				get:()=>val,
				set:(t)=>val=this.element.dataset[attr]=t
			});
		}
		this.generator=generator;
		this.team=team;
		this.resources=resources;
		this.attack=attack;
		this.speed=speed;

		this.update();
	},
	_calcMovement()
	{
		let dx=this.target.x-this.x;
		let dy=this.target.y-this.y;
		let distance=Math.sqrt(dx**2+dy**2);
		let movement={
			direction:{
				x:dx/distance,
				y:dy/distance
			},
			distance:distance
		};
		return movement
	},
	action(map,timeDiff)
	{
		let travelDistance=this.speed*timeDiff/1000;
		let movement=this._calcMovement();
		movement.distance-=travelDistance;
		if(movement.distance<=0)
		{
			//hit target
			this.target.receivePackage(map,this);
		}
		else
		{
			this.setPosition(this.x+movement.direction.x*travelDistance,this.y+movement.direction.y*travelDistance);
		}
	}
});
ResourceWar.Cursor=µ.Class(µ.gs.Component.Course.Svg.Item,{
	constructor:function(param={})
	{
		let {team=null}=param;

		param.name="cursor";
		param.tagName="use";
		param.attributes={href:"#cursor"};
		this.mega(param);

		for(let attr of ["team"])
		{
			let val=null; // prevent string conversion
			Object.defineProperty(this,attr,{
				get:()=>val,
				set:(t)=>val=this.element.dataset[attr]=t
			});
		}
		this.team=team;
	}
});
ResourceWar.Player=µ.Class(µ.gs.Component,{
	constructor:function(param={})
	{
		this.mega({
			"*":{
				stick:{
					"*":{action:"moveActive"}
				},
				button:{
					0:{action:"select"},
					1:{action:"setTarget"},
					4:{action:"clearTargets"},
					5:{action:"targetOverride"}
				}
			}
		});
		this.map=null;
		this.active=null;
		this.team=param.team;
		this.cursor=new ResourceWar.Cursor({team:param.team});
		this.overrideTarget=false;
		if(param.map) this.setMap(param.map)
	},
	setMap(map)
	{
		this.map=map;
		this.map.course.addItem(this.cursor);
	},
	setActive(generator)
	{
		this.active=generator;
		this.cursor.setPosition(generator.x,generator.y);
	},
	actions:{
		moveActive(event)
		{
			let analysis=this.analyzer.analyze(event);
			if(!analysis.pressedDown) return;

			let distance=null;
			let nextTarget=null;

			for(let item of this.map.generators)
			{
				if(item===this.active) continue;

				let relativeX=item.x-this.active.x;
				let relativeY=item.y-this.active.y;
				let itemAngle=Math.atan2(relativeX,-relativeY);
				let diff=Math.abs(analysis.direction-itemAngle);
				if(diff>Math.PI) diff=Math.PI*2-diff;

				if(diff>Math.PI/4) continue;

				let itemDistance=Math.sqrt(relativeX**2+relativeY**2);
				if(nextTarget==null||itemDistance<distance)
				{
					distance=itemDistance;
					nextTarget=item;
				}
			}
			if(nextTarget!=null)
			{
				this.setActive(nextTarget);
			}
		},
		select(event)
		{
			if(!this.analyzer.analyze(event).pressedDown) return;

			if(this.active.team!==this.team) return;
			if(this.selected!=null)
			{
				this.selected.element.classList.remove("selected");
			}
			this.active.element.classList.add("selected");
			this.selected=this.active;
		},
		setTarget(event)
		{
			if(!this.analyzer.analyze(event).pressedDown) return;

			if(this.selected&&this.active.team!==this.selected)
			{
				this.selected.setTarget(this.active);
			}
		},
		clearTargets(event)
		{
			if(!this.analyzer.analyze(event).pressedDown) return;

			for(let item of this.map.generators)
			{
				if(item.team===this.team)
				{
					item.setTarget(null);
				}
			}
		},
		targetOverride(event)
		{
			this.overrideTarget=this.analyzer.analyze(event).pressed;
		}
	}
});
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
SC.rq.json("resourceWar_maps/mapList.json")
.then(maps=>µ.gs.Game.Embed(ResourceWar,{args:[maps]}));