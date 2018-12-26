(function(µ,SMOD,GMOD,HMOD,SC) {

	let Controller=GMOD("gs.Controller");

	//SC=SC({});

	let Analyzer=Controller.Analyzer=µ.Class({
		constructor:function ({buttonThreshold=50,axisThreshold=75,stickThreshold=75}={})
		{

			this.buttonThreshold=buttonThreshold;
			this.axisThreshold=axisThreshold;
			this.stickThreshold=Math.max(Analyzer.MIN_STICK_THRESHOLD,stickThreshold); // minimum threshold for angle calculation
		},
		analyze(event)
		{
			let result=Object.create(ResultBase);
			let state=event.value;

			let analyzeFn=this["_analyze_"+event.type];
			if(!analyzeFn)
			{
				µ.logger.error("#Controller.Analyzer:001 cannot analyze event type: "+event.type,event);
				return null;
			}
			analyzeFn.call(this,state,result);
			return result;
		},
		_analyze_button(state,result)
		{
			result.pressed=state.value>this.buttonThreshold;
			result.oldPressed=state.old>this.buttonThreshold;
		},
		_analyze_axis(state,result)
		{
			result.distance=Math.abs(state.value);

			if(result.distance<this.axisThreshold) result.distance=0;
			else result.pressed=true;

			result.direction=Math.sign(result.distance);


			result.oldDistance=Math.abs(state.old);

			if(result.oldDistance<this.axisThreshold) result.oldDistance=0;
			else result.oldPressed=true;

			result.oldDirection=Math.sign(result.distance);
		},
		_analyze_stick(state,result)
		{
			let valueX=state.x.value;
			let valueY=state.y.value;
			result.distance=Math.sqrt(valueX**2+valueY**2);
			if(result.distance>this.stickThreshold)
			{
				result.pressed=true;
				result.direction=Math.atan2(valueX,valueY);
			}

			let oldX=state.x.old;
			let oldY=state.y.old;
			result.oldDistance=Math.sqrt(oldX**2+oldY**2);
			if(result.oldDistance>this.stickThreshold&&result.oldDistance>.5)
			{
				result.oldPressed=true;
				result.oldDirection=Math.atan2(oldX,oldY);
			}
		}
	});
	Analyzer.MIN_STICK_THRESHOLD=.5;
	let cachedProperties=function(obj,getterMap)
	{
		cachedProps={};
		for(let name in getterMap)
		{
			cachedProps[name]={
				configurable:true,
				get:function()
				{
					let value=getterMap[name].call(this);
					Object.defineProperty(this,name,{value});
					return value;
				}
			}
		}
		return Object.defineProperties(obj,cachedProps);
	};
	let ResultBase=µ.shortcut({
		/**
		 * input pressed state changed
		 * @type {Boolean}
		 */
		pressChanged()
		{
			return this.pressed!==this.oldPressed;
		},
		/**
		 * input is pressed now
		 * @type {Boolean}
		 */
		pressedDown()
		{
			return this.pressed&&this.pressChanged;
		},
		/**
		 * input is no longer pressed now
		 * @type {Boolean}
		 */
		pressedUp()
		{
			return !this.pressed&&this.pressChanged;
		},
		/**
		 * direction of stick reduced to 16 facets (-8 - +8)
		 * up is 0 and down is +8 and -8
		 * @type {Number}
		 */
		direction16()
		{
			return Math.round(this.direction*8/Math.PI);
		},
		/**
		 * previous direction16
		 * @type {Number}
		 */
		oldDirection16()
		{
			return Math.round(this.oldDirection*8/Math.PI);
		},
		/**
		 * stick's direction16 changed
		 * @type {boolean}
		 */
		direction16Changed()
		{
			return this.direction16!==this.oldDirection16&&(this.direction16!==8||this.direction16!==-8)
		},
		/**
		 * direction of stick reduced to 4 facets (-2 - +2)
		 * up is 0 and down is +2 and -2
		 * @type {Number}
		 */
		direction4()
		{
			return Math.round(this.direction16/4);
		},
		/**
		 * previous direction4
		 * @type {Number}
		 */
		oldDirection4()
		{
			return Math.round(this.OldDrection16/4);
		},
		/**
		 * stick's direction4 changed
		 * @type {boolean}
		 */
		direction4Changed()
		{
			return this.direction4!==this.oldDirection4&&(this.direction4!==2||this.direction4!==-2)
		}
	},{
		/**
		 * button is pressed
		 * @type {Boolean}
		 */
		pressed:null,
		/**
		 * distance of axis or stick
		 * @type {Number}
		 */
		distance:null,
		/**
		 * direction of axis: -1,0,1
		 * direction of stick: -𝛑 - +𝛑 where 0 is up and positive is right
		 * @type {Number}
		 */
		direction:null,
		/**
		 * button was pressed
		 * @type {Boolean}
		 */
		oldPressed:null,
		/**
		 * distance of axis or stick
		 * @type {Number}
		 */
		OldDistance:null,
		/**
		 * direction of axis: -1,0,1
		 * direction of stick: -𝛑 - +𝛑 where 0 is up and positive is right
		 * @type {Number}
		 */
		oldDirection:null,
	});

	SMOD("gs.Con.Analyzer",Analyzer);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);