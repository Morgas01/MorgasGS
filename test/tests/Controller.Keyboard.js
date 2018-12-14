module("Controller.Keyboard",[
	function initialize(container)
	{
		new µ.gs.Controller.Keyboard();
		addResult(container,true);
	},
	function testArea(container)
	{
		let ctrl=new µ.gs.Controller.Keyboard({
			mappings:{
				buttons:{
					"Space":0
				},
				axes:{
					"KeyQ":{index:0,negative:true},
					"KeyE":{index:0,negative:false},
				},
				sticks:{
					"KeyW":{index:0,axis:"y",negative:false},
					"KeyA":{index:0,axis:"x",negative:true},
					"KeyS":{index:0,axis:"y",negative:true},
					"KeyD":{index:0,axis:"x",negative:false},
				}
			}
		});

		let textarea=document.createElement("TEXTAREA");
		textarea.cols=70;
		textarea.rows=3;
		container.appendChild(textarea);

		let listener=function(event)
		{
			if(ctrl.parseEvent(event))
			{
				event.preventDefault();
			}
		};
		textarea.addEventListener("keydown",listener,false);
		textarea.addEventListener("keyup",listener,false);

		ctrl.addEventListener("controllerChange",null,function(event)
		{
			textarea.value=JSON.stringify(event)+"\n";
		});

	},
])