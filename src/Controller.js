(function(µ,SMOD,GMOD,HMOD,SC){

	let gs=µ.gs=µ.gs||{};

	let Event=GMOD("Event");

	SC=SC({
		remove:"array.remove",
		removeIf:"array.removeIf",
		Reporter:"EventReporterPatch",

		Button:"gs.Button",
		Axis:"gs.Axis",
		Stick:"gs.Stick"
	});

	gs.Controller=µ.Class({
		constructor:function({buttons=[],axes=[],sticks=[]}={})
		{
			this.buttons=[];
			this.axes=[];
			this.sticks=[];

			this.addButtons(buttons);
			this.addAxes(axes);
			this.addSticks(sticks);

			new SC.Reporter(this)
			.introduce(gs.Controller.ChangeEvent);

		},
		addButtons(buttons)
		{
			this.buttons.push(...buttons);
		},
		removeButtons(buttons)
		{
			SC.removeIf(this.buttons,buttons.includes,true,buttons)
		},
		removeButton(button)
		{
			SC.remove(this.buttons,button);
		},
		addAxes(axes)
		{
			this.axes.push(...axes);
		},
		removeAxes(axes)
		{
			SC.removeIf(this.axes,axes.includes,true,axes)
		},
		removeAxe(axe)
		{
			SC.remove(this.axes,axe);
		},
		addSticks(sticks)
		{
			this.sticks.push(...sticks);
		},
		removeSticks(sticks)
		{
			SC.removeIf(this.sticks,sticks.includes,true,sticks)
		},
		removeStick(stick)
		{
			SC.remove(this.sticks,stick);
		},
		getState()
		{
			return {
				buttons:this.buttons.map(b=>b.getState()),
				axes:this.axes.map(a=>a.getState()),
				sticks:this.sticks.map(s=>s.getState()),
			};
		},
		setButton:function(index,value)
		{
			if(index<0||index>=this.buttons.length)
			{
				µ.logger.error(`#gs.Controller:001 index out of bounds (Button ${index})`);
				return;
			}
			let button=this.buttons[index];
			if(button.setValue(value))
			{
				this.reportEvent(new gs.Controller.ChangeEvent("button",index,button.getState()));
			}
		},
		setAxis:function(index,value)
		{
			if(index<0||index>=this.axes.length)
			{
				µ.logger.error(`#gs.Controller:002 index out of bounds (Axis ${index})`);
				return;
			}
			let axis=this.axes[index];
			if(axis.setValue(value))
			{
				this.reportEvent(new gs.Controller.ChangeEvent("axis",index,axis.getState()));
			}
		},
		setStick:function(index,valueX,valueY)
		{
			if(index<0||index>=this.sticks.length)
			{
				µ.logger.error(`#gs.Controller:003 index out of bounds (stick ${index})`);
				return;
			}
			let stick=this.sticks[index];
			if(stick.setValue(valueX,valueY))
			{
				this.reportEvent(new gs.Controller.ChangeEvent("stick",index,stick.getState()));
			}
		},
		toJSON()
		{
			return {
				buttons:this.buttons,
				axes:this.axes,
				sticks:this.sticks
			};
		}
	});

	gs.Controller.fromJSON=function(json)
	{
		if(json.buttons) json.buttons=buttons.map(SC.Button.fromJSON);
		if(json.axes) json.axes=json.axes.map(SC.Axis.fromJSON);
		if(json.sticks) json.sticks=json.sticks.map(SC.Sticks.fromJSON);

		return new gs.Controller(buttons,axes,sticks);
	};

	SMOD("gs.Controller",gs.Controller);

	gs.Controller.ChangeEvent=µ.Class(Event,
	{
		name:"controllerChange",
		constructor:function(type,index,value)
		{
			/** @type {String} "button", "axis" or "stick" */
			this.type=type;
			/** @type {Number} */
			this.index=index;
			/** @type {gs.Button|gs.Axes|gs.Stick} */
			this.value=value;
		}
	});

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);