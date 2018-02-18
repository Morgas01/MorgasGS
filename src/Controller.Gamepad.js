(function(µ,SMOD,GMOD,HMOD,SC){

	let Controller=GMOD("gs.Controller");

	SC=SC({
		Button:"gs.Button",
		Axis:"gs.Axis",
		Stick:"gs.Stick"
	});

	Controller.Gamepad=µ.Class(Controller,{
		constructor:function(gamepad,param={})
		{
			delete param.sticks // don't adopt sticks, because they are generated from associations to axes
			this.mega(param);
			this.gamepad=gamepad;

			this.mappings={
				buttons:{},
				axes:{},
				sticks:{}
			};
			for(let i=0;i<this.gamepad.buttons.length;i++)
			{
				// generate missing buttons
				if(this.buttons.length===i) this.buttons[i]=new SC.Button();;
				this.mappings.buttons[i]=i;
			}
			for(let i=0;i<this.gamepad.axes.length;i++)
			{
				// generate missing axes
				if(this.axes.length===i) this.axes[i]=new SC.Axis();
				this.mappings.axes[i]=i;
			}

			if(param.mappings) this.associate(param.mappings);

		},
		associate({buttons={},axes={},sticks={}})
		{
			for(let key in buttons)
			{
				this.associateButton(key,buttons[key]);
			}

			for(let key in axes)
			{
				let settings=axes[key];
				this.associateAxis(key,settings.index,settings.negative);
			}

			for(let key in sticks)
			{
				let settings=sticks[key];
				this.associateStick(key,settings.index,settings.axis,settings.negative);
			}
		},
		/**
		 * @param {Number} fromIndex
		 * @param {Number} toIndex - null means ignore button
		 */
		associateButton(fromIndex,toIndex)
		{
			this.mapping.buttons[fromIndex]=toIndex;
		},
		/**
		 * @param {Number} fromIndex
		 * @param {Number} toIndex - null means ignore axis
		 */
		associateAxis(fromIndex,toIndex)
		{
			this.mapping.axes[fromIndex]=toIndex;
		},
		/**
		 * @param {Number} axisIndex
		 * @param {Number} stickIndex
		 * @param {String} direction - "x" or "y"
		 */
		associateStick(axisIndex,stickIndex,direction)
		{
			this.mapping.sticks[axisIndex]={
				index:stickIndex,
				direction:direction
			};

			if(!(stickIndex in this.sticks))
			{
				this.sticks[stickIndex]=new SC.Stick();
			}
			if(direction==="x") this.sticks[stickIndex].setXAxis(this.axes[axisIndex]);
			else this.sticks[stickIndex].setYAxis(this.axes[axisIndex]);

			// remove axis mapping
			delete this.mapping.axes[axisIndex];
		},
		update()
		{
			let gamepad=navigator.getGamepads()[this.gamepad.index];
			if(this.gamepad.timestamp!=gamepad.timestamp)
			{
				this.gamepad=gamepad;

				for(let i=0;i<=gamepad.buttons.length;i++)
				{
					let buttonIndex=this.mappings.buttons[i];
					if(buttonIndex!=null) this.buttons[buttonIndex].setValue(gamepad.buttons[i].value);
				}

				for(let i=0;i<=gamepad.axes.length;i++)
				{
					let stickMapping=this.mappings.sticks
					if(stickMapping)
					{
						let valueX=null;
						let valueY=null;
						if(stickMapping.direction==="x") valueX=gamepad.axes[i];
						else valueY=gamepad.axes[i];
						return this.setStick(stickMapping.index,valueX,valueY);
					}
					else
					{
						let axisIndex=this.mappings.axes[i];
						if(axisIndex!=null) this.axes[axisIndex].setValue(gamepad.axes[i]);
					}
				}
			}
		},
		toJSON()
		{
			let json=this.mega();
			json.mappings=this.mappings;
		}
	});

	SMOD("gs.Controller.Gamepad",Controller.Gamepad);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);