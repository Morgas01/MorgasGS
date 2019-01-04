(function(µ,SMOD,GMOD,HMOD,SC){

	let Component=GMOD("gs.Component");

	SC=SC({
		repeat:"array.repeat",
		register:"register"
	});

	/** this Component consumes all Controller events and displays their effect*/
	let ControllerStatus=Component.ControllerStatus=µ.Class(Component,{
		constructor:function(mapping=ControllerStatus.STD_MAPPING,{
			buttons=6,
			axes=0,
			sticks=1
		}={})
		{
			this.mega(mapping,{buttonThreshold:0,axisThreshold:0,stickThreshold:0});

			this.domElement=document.createElement("DIV");
			this.domElement.classList.add("Component","ControllerStatus");
			this.domElement.style.gridTemplateRows="[sticks] [axes] [buttons]";

			this.inputElements=SC.register(2,([type,index])=>
			{
				let element=document.createElement("FIELDSET");
				element.style["grid-area"]=`${type} / ${index+1} / ${type} / ${index+1}`;
				this.domElement.appendChild(element);
				let legend=document.createElement("LEGEND");
				legend.textContent=`${type} ${index}`;
				element.appendChild(legend);
				return element;
			});

			SC.repeat(buttons,this.getButton,this);
			SC.repeat(axes,this.getAxis,this);
			SC.repeat(sticks,this.getStick,this);
		},
		getButton(index)
		{
			let element=this.inputElements["button"][index];
			if(element.children.length<=1)
			{// empty
				let meter=document.createElement("METER");
				meter.min=0;
				meter.max=meter.optimum=100;
				meter.low=30;
				meter.high=80;
				meter.name="meter";
				element.appendChild(meter);

				let valueText=document.createElement("SPAN")
				valueText.name="valueText";
				element.appendChild(valueText);
			}
			return element;
		},
		getAxis(index)
		{
			let element=this.inputElements["axis"][index];
		},
		getStick(index)
		{
			let element=this.inputElements["stick"][index];
		},
		actions:{
			show:function(event)
			{
				switch(event.type)
				{
					case "button":
					{
						let element=this.getButton(event.index);
						break;
					}
					case "axis":
					{
						break;
					}
					case "stick":
					{
						break;
					}
				}
			}
		},
		destroy()
		{
			this.domElement.remove();
			this.mega();
		}
	});
	ControllerStatus.STD_MAPPING={
		"*":{
			action:"show"
		}
	};

	SMOD("gs.Comp.ControllerStatus",ControllerStatus)

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);