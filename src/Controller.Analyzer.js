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
			let result={
				/**
				 * button is pressed
				 * @type {Boolean}
				 */
				pressed:null,
				/**
				 * button's pressed state changed
				 * @type {Boolean}
				 */
				pressChange:null,
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
				 * previous direction
				 * @type {Number}
				 */
				oldDirection:null,
				/**
				 * direction of stick reduced to 16 facets (-8 - +8)
				 * up is 0 and down is +8 and -8
				 * @type {Number}
				 */
				direction16:null,
				/**
				 * previous direction16
				 * @type {Number}
				 */
				oldDirection16:null,
			};
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
			result.pressChange=(state.old>this.buttonThreshold)!=result.pressed;
		},
		_analyze_axis(state,result)
		{
			result.distance=Math.abs(state.value);
			if(result.distance<this.axisThreshold)
			{
				result.distance=0;
			}
			result.direction=Math.sign(result.distance);

			result.oldDistance=Math.abs(state.old);
			if(result.oldDistance<this.axisThreshold)
			{
				result.oldDistance=0;
			}
			result.oldDirection=Math.sign(result.distance);
		},
		_analyze_stick(state,result)
		{
			let valueX=state.x.value;
			let valueY=state.y.value;

			result.distance=Math.sqrt(valueX**2+valueY**2);
			if(result.distance>this.stickThreshold)
			{
				result.pressed=true
				result.direction=Math.atan2(valueX,valueY);
				result.direction16=Math.round(result.direction*8/Math.PI);
			}

			let oldX=state.x.old;
			let oldY=state.y.old;
			result.oldDistance=Math.sqrt(oldX**2+oldY**2);
			result.pressChange=(result.oldDistance>this.stickThreshold)!=result.pressed;
			if(result.oldDistance>this.stickThreshold&&result.oldDistance>.5)
			{
				result.oldDirection=Math.atan2(oldX,oldY);
				result.oldDirection16=Math.round(result.oldDirection*8/Math.PI)
			}
		}
	});
	Analyzer.MIN_STICK_THRESHOLD=.5;

	SMOD("gs.Con.Analyzer",Analyzer);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);