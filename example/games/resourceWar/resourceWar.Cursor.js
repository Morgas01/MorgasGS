(function(µ,SMOD,GMOD,HMOD,SC)
{
	//SC=SC({});

	ResourceWar.Cursor=µ.Class(µ.gs.Component.Course.Svg.Item,{
		constructor:function(param={})
		{
			let {team=null}=param;

			param.name="cursor";
			param.tagName="use";
			param.attributes={href:"#cursor"};
			this.mega(param);

			for(let attr of ["team"])
			{
				let val=null; // prevent string conversion
				Object.defineProperty(this,attr,{
					get:()=>val,
					set:(t)=>val=this.element.dataset[attr]=t
				});
			}
			this.team=team;
		}
	});

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
