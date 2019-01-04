let playerIcons={
	1:"❌",
	2:"〇"
};
let valueMapper=function(element,data)
{
	element.textContent=playerIcons[data];
};
let TickTackToe=µ.Class(µ.gs.Game,{
	name:"TickTackToe",
	constructor:function(param)
	{
		this.mega(param);

		this.data=[];
		this.list=new µ.gs.Component.List(this.data,valueMapper,{columns:3});
		this.domElement.appendChild(this.list.domElement);
		this.analyzer=new µ.gs.Controller.Analyzer();

		this.turn=1;

		this.congratulationMessage=document.createElement("DIV");
		this.congratulationMessage.classList.add("congratulationMessage");

		this.restart();
		this.calcSize();
		window.addEventListener("resize",()=>this.calcSize());

		this.list.addEventListener("gs.Select",this,this.onSelect);
	},
	restart()
	{
		this.domElement.classList.remove("congratulation");
		this.congratulationMessage.remove();
		this.data.length=0;
		this.data.push(0,0,0,0,0,0,0,0,0);
		this.list.active=4;
		this.list.update();
	},
	onControllerChange(event)
	{
		this.list.consumeControllerChange(event);
	},
	onSelect(selectEvent)
	{
		if(this.domElement.classList.contains("congratulation"))
		{
			this.restart();
		}
		else if(!selectEvent.data)
		{
			this.data[selectEvent.index]=this.turn;
			this.turn=this.turn%2+1;
			this.list.update();
			let won=this.checkWin();
			if(won!=0)
			{
				this.showCongratulation(won);
			}
			else if(this.checkFull())
			{
				this.restart();
			}
		}
		else if(this.checkFull())
		{
			this.restart();
		}
	},
	calcSize()
	{
		let size=Math.min(this.domElement.clientHeight,this.domElement.clientWidth);
		this.domElement.style.setProperty("font-size",Math.floor(size/4)+"px");
	},
	checkWin()
	{
		for(let i=0;i<3;i++)
		{
			if(this.data[i*3]!=0&&this.data[i*3]==this.data[i*3+1]&&this.data[i*3]==this.data[i*3+2])
			{
				return this.data[i*3];
			}
			if(this.data[i]!=0&&this.data[i]==this.data[i+3]&&this.data[i]==this.data[i+6])
			{
				return this.data[i];
			}
		}
		if(
			this.data[4]!=0
			&&
			(this.data[0]==this.data[4]&&this.data[4]==this.data[8])
			||
			(this.data[2]==this.data[4]&&this.data[4]==this.data[6])
		)
		{
			return this.data[4];
		}
		return 0;
	},
	showCongratulation(player)
	{
		this.domElement.classList.add("congratulation");
		this.congratulationMessage.textContent=playerIcons[player]+" wins!!!";
		this.domElement.appendChild(this.congratulationMessage);
	},
	checkFull()
	{
		return this.data.every(d=>d!==0);
	}
});

µ.gs.Game.Embed(TickTackToe);