(function(µ,SMOD,GMOD,HMOD,SC){

	let gs=µ.gs=µ.gs||{};

	SC=SC({
		remove:"array.remove"
	});

	/** Base class for stack/list of Components */
	gs.Panel=µ.Class({
		constructor:function()
		{
			this.stack=[];
		},
		setStack(...components)
		{
			this.stack=components;
		},
		addComponent(...components)
		{
			this.removeComponent(...components);
			this.stack.push(...components);
		},
		unshiftComponent(...components)
		{
			this.removeComponent(...components);
			this.stack.unshift(...components);
		},
		removeComponent(...components)
		{
			for(let component of components)
			{
				while(SC.remove(this.stack,component)!=-1);
			}
		},
		consumeControllerChange(event)
		{
			for(let i=this.stack.length-1;i>=0;i--)
			{
				let component=this.stack[i];
				if(component.consumeControllerChange(event)) return;
			}
		}
	});

	SMOD("gs.Panel",gs.Panel);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);