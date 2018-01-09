(function(µ,SMOD,GMOD,HMOD,SC){

    let gs=µ.gs||{};

	SC=SC({
		remove:"array.remove"
		removeIf:"array.removeIf"
	});

	gs.Controller=µ.Class({
		constructor:function(buttons=[],axes=[],sticks=[])
		{
			this.buttons=[];
			this.axes=[];
			this.sticks=[];

			this.addButtons(buttons);
			this.addAxes(axes);
			this.addSticks(sticks);
		},
		addButtons(buttons)
		{
			this.buttons.push(buttons...);
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
			this.axes.push(axes...);
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
			this.sticks.push(sticks...);
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
		}
	});

	SMOD("gs.Controller",gs.Controller);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);