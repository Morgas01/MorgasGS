(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		proxy:"proxy"
	});

	ResourceWar.MapEndScreen=µ.Class({
		constructor:function(won)
		{
			this.domElement=document.createElement("DIV");
			this.domElement.classList.add("mapEndScreen");
			this.domElement.innerHTML=`<h1>YOU ${won?'WIN':'LOSE'}!</h1>`;
			this.list=new µ.gs.Component.List(["next","retry","menu"]);
			this.domElement.appendChild(this.list.domElement);

			SC.proxy(this.list,["addEventListener","consumeControllerChange"],this)
		},
		destroy()
		{
			this.domElement.remove();
			this.mega();
		}
	});

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);