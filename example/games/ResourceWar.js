(function(µ,SMOD,GMOD,HMOD,SC)
{
	SC=SC({
		Promise:"Promise",
		rq:"request"
	});
	new SC.Promise([
		SC.rq.json("resourceWar/maps/mapList.json"),
		loadScripts([
			"resourceWar/resourceWar.js",
			[
				"resourceWar/resourceWar.Map.js",
				"resourceWar/resourceWar.Generator.js",
				"resourceWar/resourceWar.Package.js",
				"resourceWar/resourceWar.Cursor.js",
				"resourceWar/resourceWar.Player.js",
				"resourceWar/resourceWar.Npc.js",
				"resourceWar/resourceWar.MapEndScreen.js"
			]
		])
	])
    .then(maps=>µ.gs.Game.Embed(ResourceWar,{args:[maps]}));

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);