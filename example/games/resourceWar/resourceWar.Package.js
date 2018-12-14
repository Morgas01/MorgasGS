(function(µ,SMOD,GMOD,HMOD,SC)
{
	//SC=SC({});

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

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
