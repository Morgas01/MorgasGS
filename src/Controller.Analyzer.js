(function(µ,SMOD,GMOD,HMOD,SC) {

	let gs=µ.gs=µ.gs||{};

	//SC=SC({});

	let Analyzer=Controller.Analyzer=µ.Class({
		constructor:function ({buttonThreshold=50,axisThreshold=75,stickThresholdX=75,stickThresholdY=75}={})
		{

			this.buttonThreshold=buttonThreshold;
			this.axisThreshold=axisThreshold;
			this.stickThresholdX=stickThresholdX;
			this.stickThresholdY=stickThresholdY;
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
			switch (event.type)
			{
				case "button":
					if(state.value>this.buttonThreshold)
					{
						result.pressed=true;
						result.pressChange=state.old<this.buttonThreshold;
					}
					else
					{
						result.pressChange=state.old>=this.buttonThreshold;
					}
					break;
				case "axis":
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
					break;
				case "stick":
				{
					let valueX=state.x.value<this.stickThresholdX?0:state.x.value;
					let valueY=state.y.value<this.stickThresholdY?0:state.y.value;

					result.distance=Math.sqrt(valueX**2+valueY**2);
					if(distance>.5)
					{
						result.direction=Math.atan2(valueX,valueY);
						result.direction16=Math.round(result.direction*8/Math.PI)
					}

					let oldX=state.x.old<this.stickThresholdX?0:state.x.old;
					let oldY=state.y.old<this.stickThresholdY?0:state.y.old;
					result.oldDistance=Math.sqrt(stateX.old**2+stateY.old**2);
					if(result.oldDistance>.5)
					{
						result.oldDirection=Math.atan2(oldX,oldY);
						result.oldDirection16=Math.round(result.oldDirection*8/Math.PI)
					}
					break;
				}
			}
			return result;
		}
	});

	SMOD("gs.Con.Analyzer")

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);