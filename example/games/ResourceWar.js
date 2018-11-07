
let SC=µ.shortcut({
	rs:"rescope",
	mapRegister:"mapRegister",
	rq:"request"
});

let ResourceWarGameWrapper=µ.Class(µ.gs.Game,{
	name:"ResourceWar",
	constructor:function()
	{
		this.mega();
		this.resourceWar=new ResourceWar();
		this.domElement.appendChild(this.resourceWar.domElement);
	},
	onControllerChange(event)
	{
		this.resourceWar.consumeControllerChange(event);
	},
	setPause(value)
	{
		this.mega(value);
		this.resourceWar.setPause(value);
	}
});
let ResourceWar=µ.Class(µ.gs.Component,{
	constructor:function()
	{
		µ.util.function.rescope.all(this,["loop"]);
		this.mega();

		this.time=0;
		this.pause=true;
		this.course=new µ.gs.Component.Course.Svg();
		this.domElement=this.course.domElement;

		this.loopId=null;
		this.lastTime=null;
		this.movementRegister=SC.mapRegister();

		this.player=new ResourceWar.Player({team:1});
		this.npcs=[];

		this._createSymbols();

		this.loadLevel("tutorial_2")
		//.then(()=>this.setPause(false)); // set game pause state
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
			for(let generatorJson of json.generators)
			{
				generatorJson.course=this.course;
				let item=new ResourceWar.Generator(generatorJson);
				if(item.team==1)
				{
					firstActive=item;
				}
				this.course.addItem(item);
			}

			this.player.setCourse(this.course,firstActive);
			this.npcs.push(new ResourceWar.Npc({team:2}))
		});
	},
	consumeControllerChange(event)
	{
		this.player.consumeControllerChange(event);
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
		let diff=timeNow-this.lastTime;
		this.lastTime=timeNow;
		this.time+=diff;

		let generators=[];
		for(let item of this.course.items)
		{
			switch (item.name)
			{
				case "generator":
					generators.push(item);
					this.updateGenerator(item);
					break;
				case "package":
					this.updatePackage(item,diff);
				case "cursor":
					// od nothing
					break;
				default:
					throw new RangeError("unknown item in Course");
			}
		}
		for (let npc of this.npcs)
		{
			this.updateNpc(npc,generators);
		}
	},
	setActive(generator)
	{
		if(this.active)
		{
			this.active.svgElement.classList.remove("active");
		}
	},
	getPackageMovement(generator)
	{
		let movement=this.movementRegister.get(generator).get(generator.target);
		if(!movement)
		{
			let dx=generator.target.x-generator.x;
			let dy=generator.target.y-generator.y;
			let distance=Math.sqrt(dx**2+dy**2);
			movement={
				direction:{
					x:dx/distance,
					y:dy/distance
				},
				distance:distance
			};
			this.movementRegister.get(generator).set(generator.target,movement);

			let reverseMovement={
				direction:{
					x:-movement.direction.x,
					y:-movement.direction.y
				},
				distance:movement.distance
			};
			this.movementRegister.get(generator.target).set(generator,reverseMovement);
		}
		return movement
	},
	createPackage(generator)
	{
		let packageResources=Math.ceil(generator.resources*generator.packageRatio);
		if(packageResources>0)
		{
			let speed=Math.max(5,generator.packageSpeed-packageResources*generator.packageSpeedFraction);
			generator.resources-=packageResources;
			let pack=new ResourceWar.Package({
				generator:generator,
				speed:speed,
				resources:packageResources,
				movement:this.getPackageMovement(generator)
			});
			generator.update();
			this.course.addItem(pack);
		}
	},
	updateGenerator(generator)
	{
		if(generator.nextGenerationTime<this.time)
		{
			generator.generate();
		}

		if(generator.nextPackageTime<this.time&&generator.target!=null&&generator.resources>=generator.min)
		{
			this.createPackage(generator);
			if(generator.nextPackageTime+generator.packageRate<this.time)
			{
				generator.nextPackageTime=this.time;
			}
			generator.nextPackageTime+=generator.packageRate;
		}
	},
	updatePackage(packageItem,timeDiff)
	{
		let travelDistance=packageItem.speed*timeDiff/1000;
		packageItem.distance-=travelDistance;
		if(packageItem.distance<=0)
		{
			//hit target

			let generator = packageItem.target;
			if(generator.team===packageItem.team)
			{
				generator.resources+=packageItem.resources;
			}
			else
			{
				generator.resources-=packageItem.resources;
				if(generator.resources<=0)
				{
					generator.resources=-generator.resources;
					generator.team=packageItem.team;
					generator.setTarget(null);
					generator.nextGenerationTime=this.time+generator.generationRate;
				}
			}
			generator.update();
			this.course.removeItem(packageItem);
			packageItem.destroy();
		}
		else
		{
			packageItem.setPosition(packageItem.x+packageItem.direction.x*travelDistance,packageItem.y+packageItem.direction.y*travelDistance);
		}
	},
	updateNpc(npc,generators)
	{
		if(npc.nextActionTime<this.time)
		{
			npc.action(generators);
		}
	}
});
ResourceWar.loadedLevels=new Map();

ResourceWar.Generator=µ.Class(µ.gs.Component.Course.Svg.Item,{
	generatorID:0,
	constructor:function(param={})
	{
		this.generatorID=ResourceWar.Generator.prototype.generatorID++;

		param.name="generator";

		this.mega(param);

		this.element.classList.add("generator");
		this.element.dataset.id=this.generatorID
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
			generationRate:this.generationRate=1000,
			/**
			 * max resources
			 * @type {number}
			 */
			max:this.max=100,
			/**
			 * min resources to create packages
			 * @type {number}
			 */
			min:this.min=3,

			packageRate:this.packageRate=500,
			packageRatio:this.packageRatio=0.1,
			packageSpeed:this.packageSpeed=20,
			packageSpeedFraction:this.packageSpeedFraction=0.5
		}=param);

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
		if(this.target!=target&&target!=this)
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
			this.nextGenerationTime+=this.generationRate;
			this.update();
		}
	}
});
ResourceWar.Package=µ.Class(µ.gs.Component.Course.Svg.Item,{
	constructor:function(param={})
	{
		let {
			generator:{
				team=null,
				target,
				x,
				y
			},
			speed=20,
			resources,
			movement:{
				direction,
				distance
			}
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
		this.team=team;
		this.resources=resources;
		this.direction=direction;
		this.distance=distance;
		this.speed=speed;
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
		this.mega(new Map([[null,{
			stick:{
				null:{
					action:"moveActive"
				}
			},
			button:{
				0:{
					action:"select"
				},
				1:{
					action:"setTarget"
				},
				4:{
					action:"clearTargets"
				},
				5:{
					action:"clearTargets"
				},
				null:{
					action:"action"
				}
			}
		}]]));
		this.course=param.course;
		this.active=null;
		this.team=param.team;
		this.cursor=new ResourceWar.Cursor({team:param.team});
	},
	setCourse(course,active)
	{
		this.course=course;
		this.course.addItem(this.cursor);
		this.setActive(active);
	},
	setActive(generator)
	{
		this.active=generator;
		this.cursor.setPosition(generator.x,generator.y);
	},
	actions:{
		moveActive(event)
		{
			let value=Math.sqrt(event.value.x**2+event.value.y**2);
			if(value<.5) return false;
			let angle=Math.atan2(-event.value.y,event.value.x);
			let distance=null;
			let nextTarget=null;
			for(let item of this.course.items)
			{
				if(item==this.active||!(item instanceof ResourceWar.Generator))
				{
					continue;
				}

				let relativeX=item.x-this.active.x;
				let relativeY=item.y-this.active.y;
				let itemAngle=Math.atan2(relativeY,relativeX);
				let diff=Math.abs(angle-itemAngle);
				if(diff>Math.PI) diff=Math.PI*2-diff;
				if(diff>Math.PI/4)
				{
					continue;
				}

				let itemDistance=Math.sqrt(relativeX**2+relativeY**2);
				if(distance==null||itemDistance<distance)
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
			if(this._acceptButton(event))
			{
				if(this.active.element.dataset.team!=this.team) return false;
				if(this.selected!=null)
				{
					this.selected.element.classList.remove("selected");
				}
				this.active.element.classList.add("selected");
				this.selected=this.active;
			}
		},
		setTarget(event)
		{
			if(this._acceptButton(event))
			{
				if(this.selected&&this.active.team!=this.selected)
				{
					this.selected.setTarget(this.active);
				}
			}
		},
		clearTargets(event)
		{
			if(this._acceptButton(event))
			{
				for(let item of this.course.items)
				{
					if(item.name=="generator"&&item.team==this.team)
					{
						item.setTarget(null);
					}
				}
			}
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
	action(generators)
	{
		this.nextActionTime+=this.interval;
		let myBiggest=null;
		let easyTarget=null;
		for (let generator of generators)
		{
			if(generator.team===this.team)
			{
				if(generator.target!=null)
				{
					if(generator.target.team==this.team) generator.setTarget(null);
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

µ.gs.Game.Embed(ResourceWarGameWrapper);