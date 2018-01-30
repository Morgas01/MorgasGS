let valueMapper=function(element,data)
{
	let text="";
	switch (data)
	{
		case 1:
			text="❌";
			break;
		case 2:
			text="〇";
			break;
	}
	element.textContent=text;
};
let TickTackToe=µ.Class(µ.gs.Game.Embedded,{
	name:"TickTackToe",
	constructor:function()
	{
		this.mega();

		this.data=[];
		this.list=new µ.gs.Component.List(this.data,valueMapper,{columns:3});
		this.domElement.appendChild(this.list.domElement);

		this.buttonPressed=0;
		this.turn=1;

		this.restart();
	},
	restart()
	{
		this.data.length=0;
		this.data.push(0,0,0,0,0,0,0,0,0);
		this.list.active=4;
		this.list.update();
	},
	onControllerChange(event)
	{
		if(!this.list.consumeControllerChange(event)&&event.type==="button")
		{
			let index=event.index+1;
			let nextState=this.buttonPressed&(event.pressed?index:~index);
			if(!this.buttonPressed && nextState && !this.data[this.list.active])
			{
				this.data[this.list.active]=this.turn;
				this.turn=this.turn%2+1;
				this.list.update();
			}
			this.buttonPressed=nextState;
		}
	}
});

new TickTackToe();