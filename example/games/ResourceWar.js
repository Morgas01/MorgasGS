
let SC=µ.shortcut({
	rs:"rescope"
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
	}
});
let ResourceWar=µ.Class(µ.gs.Component,{
	constructor:function()
	{
		µ.util.function.rescope.all(this,["loop"]);
		this.mega();
		this.course=new µ.gs.Component.Course.Svg();
		this.domElement=this.course.domElement;
		let generatorSymbol=this.course.createElement("symbol");
		generatorSymbol.innerHTML=
`
<circle r="2" cx="2" cy="2" class="generator-outer"></circle>
<circle r="1" cx="2" cy="2" class="generator-inner"></circle>
`		;
		generatorSymbol.id="generator";
		this.course.domElement.appendChild(generatorSymbol);
		let cursorSymbol=this.course.createElement("symbol");
		cursorSymbol.innerHTML=
`
<circle r="1.75" cx="2" cy="2" class="cursor">
	<animate attributeName="r" dur="2" values="1.75;.25;1.75" repeatCount="indefinite" keyTimes="0;.75;1"></animate>
</circle>
`		;
		cursorSymbol.id="cursor";
		this.course.domElement.appendChild(cursorSymbol);

		this.loopId=null;
		this.lastTime=null;

		let item1=new ResourceWar.Generator({course:this.course,team:1,x:5,y:5});
		let item2=new ResourceWar.Generator({course:this.course,x:80,y:70});
		this.course.addItems([
			item1,
			item2,
			new ResourceWar.Generator({course:this.course,x:60,y:50,resources:10}),
			new ResourceWar.Generator({course:this.course,x:60,y:70}),
			new ResourceWar.Generator({course:this.course,x:80,y:50})
		]);
		this.player=new ResourceWar.Player({course:this.course,team:1,active:item1});

	},
	setPause(value)
	{
		this.mega(value);
		if(this.pause)
		{
			cancelAnimationFrame(this.loopId);
			this.lastTime=null;
		}
		else this.loop();
	},
	consumeControllerChange(event)
	{
		this.player.consumeControllerChange(event);
	},
	loop(time)
	{
		cancelAnimationFrame(this.loopId); //prevent simultaneous calls
		this.loopId=requestAnimationFrame(this.loop);
		if(!this.lastTime)
		{
			this.lastTime=time;
			return;
		}
		let diff=time-this.lastTime;
		this.lastTime=time;

		//this.player.step(diff,this.lastTime);
	},
	setActive(generator)
	{
		if(this.active)
		{
			this.active.svgElement.classList.remove("active");
		}
	}
});
ResourceWar.Generator=µ.Class(µ.gs.Component.Course.Svg.Item,{
	generatorID:0,
	constructor:function(param={})
	{
		let {team=null,resources=0,generation=1,max=99}=param;
		this.generatorID=ResourceWar.Generator.prototype.generatorID++;

		SC.rs.all(this,["generate","sendPackage"]);

		param.name="generator "+this.generatorID;

		this.mega(param);
		for(let attr of ["team","resources","generation","max"])
		{
			let val=null; // prevent string conversion
			Object.defineProperty(this,attr,{
				get:()=>val,
				set:(t)=>val=this.svgElement.dataset[attr]=t
			});
		}
		this.team=team;
		this.resources=resources;
		this.generation=generation;
		this.max=max;

		this.generationInerval=null;
		this.packageInerval=null;

		this.svgElement.classList.add("generator");
		this.svgElement.innerHTML=
			`
<use href="#generator"/>
<text y="1.3em"/>
`;
		this.text=this.svgElement.children[1];

		this.updateText();
		this.restartGeneration();
	},
	updateText()
	{
		let textPos;
		if(this.resources<10)
		{
			textPos=".7em";
		}
		else
		{
			textPos=".45em";
		}
		this.text.setAttribute("x",textPos);
		this.text.textContent=this.resources;
	},
	setTarget(target)
	{
		if(this.target!=target&&target!=this)
		{
			this.target=target;
			if(this.packageInerval==null)
			{
				this.packageInerval = setInterval(this.sendPackage, 900);
				this.sendPackage();
			}
		}
		else if (this.packageInerval!=null)
		{
			this.target=null;
			clearInterval(this.packageInerval);
			this.packageInerval=null;
		}
	},
	sendPackage()
	{
		if(this.target)
		{
			this._createPackage();
		}
	},
	_calcPackageResources()
	{
		return Math.ceil(this.resources/10);
	},
	_createPackage()
	{
		let packageResources=this._calcPackageResources();
		if(packageResources>0)
		{
			this.resources-=packageResources;
			new ResourceWar.Package({
				origin: this,
				resources:packageResources,
				speed:Math.max(10,30.1-packageResources/10),
				target: this.target
			});
			this.updateText();
		}
	},
	generate()
	{
		if(this.team==null)
		{
			clearInterval(this.generationInerval);
			this.generationInerval=null;
			return;
		}
		if(++this.resources>this.max)
		{
			this.resources=this.max;
		}
		this.updateText();
	},
	restartGeneration()
	{
		clearInterval(this.generationInerval);
		this.generationInerval=null;
		setInterval(this.generate,1000);
	},
	hit(packageItem)
	{
		if(this.team!=packageItem.team)
		{
			if(this.resources<packageItem.resources)
			{
				this.team=packageItem.team;
				this.resources=packageItem.resources-this.resources;
				this.restartGeneration();
			}
			else
			{
				this.resources-=packageItem.resources;
			}
		}
		else
		{
			this.resources+=packageItem.resources;
		}

		if(this.resources>this.max)
		{
			this.resources=this.max;
		}
		this.updateText();
	}
});
ResourceWar.Package=µ.Class(µ.gs.Component.Course.Svg.Item,{
	constructor:function(param={})
	{
		let {origin,origin:{team=null},target,speed=30,resources}=param;

		param.name="package "+team;
		param.tagName="circle";

		param.course=origin.course;
		this.mega(param);

		this.setAttribute("r",1+resources/100);
		this.setAttribute("cx","2");
		this.setAttribute("cy","2");

		this.svgElement.classList.add("Package");
		this.svgElement.innerHTML=
`
<animateTransform 
	attributeName="transform"
    type="translate"
    from="${origin.x} ${origin.y}"
    to="${target.x} ${target.y}"
    dur="${Math.sqrt((target.x-origin.x)**2+(target.y-origin.y)**2)/speed}s"
    repeatCount="1"
    begin="indefinite"
    fill="freeze"/>
`;

		for(let attr of ["team","resources"])
		{
			let val=null; // prevent string conversion
			Object.defineProperty(this,attr,{
				get:()=>val,
				set:(t)=>val=this.svgElement.dataset[attr]=t
			});
		}
		this.team=team;
		this.resources=resources;

		this.course.addItem(this);
		let animate = this.svgElement.children[0];
		animate.addEventListener("end",()=>
		{
			target.hit(this);
			this.destroy();
		});
		animate.beginElement();
	}
});
ResourceWar.Cursor=µ.Class(µ.gs.Component.Course.Svg.Item,{
	constructor:function(param={})
	{
		let {team=null}=param;

		param.name="cursor "+team;
		param.tagName="use";

		this.mega(param);

		this.setAttribute("href","#cursor");
		for(let attr of ["team"])
		{
			let val=null; // prevent string conversion
			Object.defineProperty(this,attr,{
				get:()=>val,
				set:(t)=>val=this.svgElement.dataset[attr]=t
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
				null:{
					action:"action"
				}
			}
		}]]));
		this.course=param.course;
		this.active=null;
		this.team=param.team;
		this.cursor=new ResourceWar.Cursor({course:this.course,team:param.team});
		this.course.addItem(this.cursor);
		this.setActive(param.active);
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
				if(this.active.svgElement.dataset.team!=this.team) return false;
				if(this.selected!=null)
				{
					this.selected.svgElement.classList.remove("selected");
				}
				this.active.svgElement.classList.add("selected");
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
		}
	}
});

µ.gs.Game.Embed(ResourceWarGameWrapper);