(function(µ,SMOD,GMOD,HMOD,SC)
{
	//SC=SC({});

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

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
