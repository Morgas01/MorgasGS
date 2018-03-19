

let Snake=µ.Class(µ.gs.Game,{
	name:"Snake",
	constructor:function()
	{
		µ.util.function.rescope.all(this,["loop"]);
		this.mega();
		this.course=new µ.gs.Component.Course.Svg();
		this.domElement.appendChild(this.course.domElement);

		this.player=new Snake.Player(50);
		this.course.addItem(this.player);

		this.loopId=null;
		this.lastTime=null;
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
	onControllerChange(event)
	{
		if(event.type==="stick")
		{
			this.player.setDirection(event.value.x,event.value.y,this.lastTime);
		}
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
		this.player.step(diff,this.lastTime);
	},
	addPart()
	{
		this.player.addPart();
	}
});

Snake.Player=µ.Class(µ.gs.Component.Course.Svg.Item,{
	partDelay:200,//milliseconds
	constructor:function(parts=1)
	{
		this.mega({name:"player",x:50,y:50});
		this.movementKeys=[];
		this.parts=[];
		this.svgElement.innerHTML='<rect width="5" height="5" fill="red" stroke="black" stroke-width="0.5" />';
		this.direction=null;
		this.setDirection(Math.random(),Math.random());
		this.velocity=.04; // unit per millisecond
		this.movementKeys.length=0;

		for(let i=0;i<parts;i++) this.addPart();
		this.step(0,0);
	},
	setDirection(x,y,time)
	{
		this.movementKeys.unshift({
			x:this.x,
			y:this.y,
			direction:this.direction,
			time:time
		});
		if(x!==0||y!==0) this.direction=Math.atan2(-y,x);
	},
	step(timeDiff,time)
	{
		let units=this.velocity*timeDiff;
		this.move(Math.cos(this.direction)*units, Math.sin(this.direction)*units);

		//check bounds
		let directionChangeX=null,directionChangeY=null;
		if(this.x>95||this.x<0)
		{
			this.setPosition(Math.min(95,Math.max(0,this.x)));
			directionChangeX=-Math.cos(this.direction)*100;
		}
		if(this.y>95||this.y<0)
		{
			this.setPosition(undefined,Math.min(95,Math.max(0,this.y)));
			directionChangeY=Math.sin(this.direction)*100;
		}
		if(directionChangeX||directionChangeY)
		{
			directionChangeX=directionChangeX||Math.cos(this.direction)*100;
			directionChangeY=directionChangeY||-Math.sin(this.direction)*100;
			directionChangeX+=50*(Math.random()-.5);
			directionChangeY+=50*(Math.random()-.5);
			this.setDirection(directionChangeX,directionChangeY,time);
		}

		let partIndex=0;
		for(let i=0;i<this.movementKeys.length;i++)
		{
			let key=this.movementKeys[i];
			let keyTime=key.time;
			while(partIndex<this.parts.length&&time-(partIndex+1)*this.partDelay>keyTime)
			{
				this.parts[partIndex].update(time,time-(partIndex+1)*this.partDelay,this.movementKeys[i-1]);
				partIndex++;
			}
			if(partIndex>=this.parts.length)
			{
				this.movementKeys.length=i;
				return;
			}
		}

		let lastKey=this.movementKeys[this.movementKeys.length-1];
		while(partIndex<this.parts.length)
		{
			this.parts[partIndex].update(time,time-(partIndex+1)*this.partDelay,lastKey);
			partIndex++;
		}
	},
	addPart()
	{
		let part=new Snake.Part(this);
		this.parts.unshift(part);
		this.svgElement.insertBefore(part.svgElement,this.svgElement.lastChild);
	}
});
let partColorCounter=22;
Snake.Part=µ.Class(µ.gs.Component.Course.Svg.Item,{
	constructor:function(player)
	{
		this.mega({name:"part"});
		this.svgElement.innerHTML='<rect width="5" height="5" fill="hsl('+((partColorCounter++)*10)%361+',100%,50%)" />';
		this.player=player;
	},
	update(timeNow,partTime,{x,y,direction,time}={
		x:this.player.x,
		y:this.player.y,
		direction:this.player.direction,
		time:timeNow
	})
	{
		let timeDiff=time-partTime;
		let units=-this.player.velocity*timeDiff;
		this.setPosition(Math.cos(direction)*units-this.player.x+x, Math.sin(direction)*units-this.player.y+y);
	}
});

µ.gs.Game.Embed(Snake);