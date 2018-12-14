(function(µ,SMOD,GMOD,HMOD,SC){

	let Controller=GMOD("gs.Controller");

	SC=SC({
		Button:"gs.Button",
		Axis:"gs.Axis",
		Stick:"gs.Stick"
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
		  * @param {Boolean} (generateButtons) defaults to true if no Button is defined
		  * @param {Boolean} (generateAxes) defaults to true if no Axis is defined
		  * @param {Boolean} (generateSticks) defaults to true if no Stick is defined
		  */
		constructor:function(param={})
		{
			this.mega(param);

			this.mapping=new Map();
			// map to hold key values for sticks to delay and gather them (allowing diagonals)
			this.stickDelays=new Map();
			this.stickDelay=30;

			if("stickDelay" in param) this.stickDelay=param.stickDelay;
			if(param.mappings) this.associate(param.mappings);

			let {
				generateButtons=this.buttons.length==0,
				generateAxes=this.axes.length==0,
				generateSticks=this.sticks.length==0,
			}=param;

			if(generateButtons) this.generateButtons();
			if(generateAxes) this.generateAxes();
			if(generateSticks) this.generateSticks();

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
		associateButton(key,index)
		{
			if(!(index in this.buttons))
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
			if(!(index in this.axes))
			{
				this.axes[index]=new SC.Axis();
			}
			this.mapping.set(key,{
				type:"axis",
				index:index,
				negative:negative
			});
		},
		/**
		 * @param {String} key
		 * @param {Number} index
		 * @param {String} axis - "x" or "y"
		 * @param {boolean} (negative)
		 */
		associateStick(key,index,axis,negative)
		{
			if(!(index in this.sticks))
			{
				this.sticks[index]=new SC.Stick();
			}
			this.mapping.set(key,{
				type:"stick",
				axis:axis,
				index:index,
				negative:negative
			});
		},
		generateButtons()
		{
			for(let value of this.mapping.values())
			{
				if(value.type=="button"&&this.buttons[value.index]==null)
				{
					this.buttons[value.index]=new SC.Button();
				}
			}
		},
        generateAxes()
        {
        	for(let value of this.mapping.values())
        	{
        		if(value.type=="axis"&&this.axes[value.index]==null)
        		{
        			this.axes[value.index]=new SC.Axis();
        		}
        	}
        },
        generateSticks()
        {
        	for(let value of this.mapping.values())
        	{
        		if(value.type=="stick"&&this.sticks[value.index]==null)
        		{
        			this.sticks[value.index]=new SC.Stick();
        		}
        	}
        },
        /**
         * @param {Event} event
         * @returns {Boolean} event consumed
         */
		parseEvent:function(event)
		{
			let mapping=this.mapping.get(event.code);
			if(mapping)
			{
				let value=(event.type=="keydown"?100:0);
				switch (mapping.type)
				{
					case "button":
						return this.setButton(mapping.index,value);
						break;
					case "axis":
						if(mapping.negative) value=-value;
						return this.setAxis(mapping.index,value);
						break;
					case "stick":
						if(mapping.negative) value=-value;
						let valueX=null;
						let valueY=null;
						if(mapping.axis==="x") valueX=value;
						else valueY=value;
						return this.setStick(mapping.index,valueX,valueY);
						break;
				}
			}
			return false;
		},
		setStick(index,x,y)
		{
			if(index<0||index>=this.sticks.length)
			{
				µ.logger.error(`#gs.Con.Keyboard:001 index out of bounds (stick ${index})`);
				return;
			}
			if(!this.stickDelays.has(index))
			{
				let data={x,y};
				this.stickDelays.set(index,data);
				setTimeout(()=>
				{
					Controller.prototype.setStick.call(this,index,data.x,data.y);
					this.stickDelays.delete(index);
				},this.stickDelay);
			}
			else
			{
				let data=this.stickDelays.get(index);
				if(x!=null) data.x=x;
				if(y!=null) data.y=y;
			}
			return true;
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

	SMOD("gs.Con.Keyboard",Controller.Keyboard);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);