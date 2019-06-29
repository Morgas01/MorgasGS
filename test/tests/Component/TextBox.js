module("Component.TextBox",[
	function initialize(container)
	{
		new µ.gs.Component.TextBox();
		addResult(container,true);
	},
	function text(container)
	{
		let box=new µ.gs.Component.TextBox([
			{
				type:"text",
				text:"slow Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ligula.\n"
			},
			{
				type:"text",
				text:"stop.\n"
			},
			{
				type:"waypoint"
			},
			{
				type:"text",
				text:"fast Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ligula.",
				interval:25
			},
			{
				type:"text",
				text:"pause.",
			},
			{
				type:"pause",
				duration:1000
			},
			{
				type:"text",
				text:"end",
			}
		]);
		container.appendChild(box.domElement);
		let btn=document.createElement("BUTTON");
		btn.textContent="Next";
		btn.addEventListener("click",box.nextPart.bind(box));
		container.appendChild(btn);

		btn=document.createElement("BUTTON");
		btn.textContent="Skip";
		btn.addEventListener("click",box.skipParts.bind(box));
		container.appendChild(btn);
	},
]);