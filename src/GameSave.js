(function(µ,SMOD,GMOD,HMOD,SC){

	let gs=µ.gs=µ.gs||{};

	let DBObj=GMOD("DBObj");

	//SC=SC({});

	gs.GameSave=µ.Class(DBObj,{
		objectType:"GameSave",
		constructor:function(param={})
		{
			this.mega(param);

			let {
				date=new Date(),
				oldSaves=[],
				state=null
			}=param;

			if(oldSaves.length>gs.GameSave.OLD_SAVE_COUNT)
			{
				oldSaves.length=gs.GameSave.OLD_SAVE_COUNT;
			}

			this.addField("date",		FIELD.TYPES.DATE	,date );
			this.addField("state",		FIELD.TYPES.JSON	,state);
			this.addField("oldSaves",	FIELD.TYPES.JSON	,oldSaves);
		}
	});
	gs.GameSave.OLD_SAVE_COUNT=3;

	SMOD("gs.GameSave",gs.GameSave);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);