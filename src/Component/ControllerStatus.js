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
			if(!element.classList.contains("button"))
			{// empty
				element.classList.add("button")
				let meter=document.createElement("METER");
				meter.min=0;
				meter.max=meter.optimum=100;
				meter.low=30;
				meter.high=80;
				meter.classList.add("buttonMeter");
				element.appendChild(meter);

				let valueText=document.createElement("SPAN")
				valueText.classList.add("buttonValueText");
				element.appendChild(valueText);

				meter.value=valueText.textContent=0;
			}
			return element;
		},
		getAxis(index)
		{
			let element=this.inputElements["axis"][index];
			return element;
		},
		getStick(index)
		{
			let element=this.inputElements["stick"][index];
			if(!element.classList.contains("stick"))
			{// empty
				element.classList.add("stick")
				let area=document.createElement("DIV");
				area.classList.add("stickArea");
				element.appendChild(area);

				let pointer=document.createElement("DIV");
				pointer.classList.add("stickPointer");
				area.appendChild(pointer);

				pointer.style.top="101em";
				pointer.style.left="101em";
			}
			return element;
		},
		actions:{
			show:function(event)
			{
				switch(event.type)
				{
					case "button":
					{
						let element=this.getButton(event.index);
						let meter=element.querySelector(".buttonMeter");
						let valueText=element.querySelector(".buttonValueText");

						meter.value=valueText.textContent=event.value.value;
						break;
					}
					case "axis":
					{
						break;
					}
					case "stick":
					{
						let element=this.getStick(event.index);
						let pointer=element.querySelector(".stickPointer");

						pointer.style.top=(101-event.value.y.value)+"em";
						pointer.style.left=(101-event.value.x.value)+"em";
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