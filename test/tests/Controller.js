module("Controller",[
	function initialize(container)
	{
		new µ.gs.Controller();
		addResult(container,true);
	},
	function report(container)
	{
		let ctrl=new µ.gs.Controller({
			buttons:[new µ.gs.Button()],
			axes:[new µ.gs.Axis()],
			sticks:[new µ.gs.Stick()]
		});

		let events=[];

		ctrl.addEventListener("controllerChange",null,function(event)
		{
			events.push(event);
		});

		let types=["Button","Axis","Stick"];
		for(let index=0;index<types.length;index++)
		{
			let type=types[index].toLowerCase();
			let methodKey="set"+types[index];

			ctrl[methodKey](0,70);
			addResult(container,events.length==index+1,type+" trigger event");

			ctrl[methodKey](0,70);
			addResult(container,events.length==index+1,type+" not trigger event");

			ctrl[methodKey](1,70);
			addResult(container,events.length==index+1,type+" index out of bounds");

		}

	},
])