
let gameSelect=document.getElementById("gameSelect");
for(let game of gameList)
{
	let option=document.createElement("OPTION");
	option.textContent=option.value=game;

	gameSelect.appendChild(option);
}

let system=new µ.gs.System();

let systemContainer=document.getElementById("systemContainer");
systemContainer.appendChild(system.domElement);

let keyboardController=new µ.gs.Controller.Keyboard({
	mappings:{
		sticks:{
			"KeyW":{index:0,axis:"y",negative:false},
			"KeyA":{index:0,axis:"x",negative:true},
			"KeyS":{index:0,axis:"y",negative:true},
			"KeyD":{index:0,axis:"x",negative:false},
		},
		buttons:{
			"KeyB":0,
			"KeyN":1,
			"KeyG":2,
			"KeyH":3,
			"KeyQ":4,
			"KeyE:5
		},
	}
});
system.addController(keyboardController);

document.getElementById("goBtn").addEventListener("click",function()
{
	let gameName=gameSelect.value;
	if(!gameName) return;

	let gameClass=µ.gs.Game.getGameByName(gameName);
	if(!gameClass)
	{
		gameClass=µ.gs.Game.Remote.implement(gameName,"games/embeddedGameLoader.html?game="+gameName);
	}
	system.setGame(new gameClass());
},false);