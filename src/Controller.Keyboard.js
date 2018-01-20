(function(µ,SMOD,GMOD,HMOD,SC){

	let Controller=GMOD("gs.Controller");

	SC=SC({
		Button:"gs.Button",
		Axis:"gs.Axis",
		Stick:"gs.Sick"
	});

	Controller.Keyboard=µ.Class(Controller,{
		/**
		 * @typedef {Object} Controller.Keyboard~mappings
		 * @param {Object.<String,Number>} (param.buttons)
		 * @param {Object.<String,{index:Number,negative:Boolean}}>} (param.axes)
		 * @param {Object.<String,{index:Number,axis:String,negative:Boolean}>} (param.sticks)
		 */
		 /**
		  * @param {Object} param
		  * @param {Controller.Keyboard~mappings} param.mappings
		  */
		constructor:function(param)
		{
			this.mega(param);

			this.mapping=new Map();


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
				let settings=axes[key];
				this.associateStick(key,settings.index,settings.axis,settings.negative);
			}
		},
		associateButton(key,index)
		{
			if(index in this.buttons)
			{
				this.buttons[index]=new SC.Button();
			}
			this.mapping.set(key,{
				type:"button",
				index:index
			});
		},
		associateAxis(key,index,negative)
		{
			if(index in this.axes)
			{
				this.axes[index]=new SC.Axis();
			}
			this.mapping.set(key,{
				type:"axis",
				index:index
			});
		},
		/**
		 * @param {String} key
		 * @param {Number} index
		 * @param {String} axis - "x" or "y"
		 * @param {boolean} (negative)
		 */
		associateButton(key,index,axis,negative)
		{
			if(index in this.sticks)
			{
				this.sticks[index]=new SC.Stick();
			}
			this.mapping.set(key,{
				type:"stick",
				axis:axis,
				index:index
			});
		},
		parseEvent:function(event)
		{
			let mapping=this.mapping.get(event.key);
			if(mapping)
			{
				let value=event.name=="keydown"?1:0;
				switch (mapping.type)
				{
					case "button":
						this.setButton(mapping.index,value);
						break;
					case "axis":
						if(mapping.negative) value=-value;
						this.setAxis(mapping.index,value);
						break;
					case "stick":
						if(mapping.negative) value=-value;
						let valueX=null;
						let valueY=null;
						if(mapping.axis==="x") valueX=value;
						else valueY=value;
						this.setStick(mapping.index,valueX,valueY);
						break;
				}
			}
		},
		toJSON()
		{
			let json=this.mega();
			json.mappings=[...this.mappings.entries()];
		}
	});

	Controller.Keyboard.fromJSON=function(json)
	{
		if(json.buttons) json.buttons=buttons.map(SC.Button.fromJSON);
		if(json.axes) json.axes=json.axes.map(SC.Axis.fromJSON);
		if(json.sticks) json.sticks=json.sticks.map(SC.Sticks.fromJSON);

		let rtn=new Controller.Keyboard(json);

		return rtn;
	};

	SMOD("gs.Controller.Keyboard",Controller.Keyboard);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);