(function(µ,SMOD,GMOD,HMOD,SC){

	let Component=GMOD("gs.Component");

	SC=SC({});

	Component.Course=µ.Class(Component,{
		[µ.Class.symbols.abstract]:true,
		constructor:function({controllerMappings,items=[],elementTag="DIV",domElement=this.domElement||document.createElement(elementTag)}={})
		{
			this.mega(controllerMappings);

			this.domElement=domElement;
			this.domElement.classList.add("Component","Course");

			this.items=new Set();

			this.addItems(items);
		},
		addItem(item)
		{
			this.items.add(item);
		},
		addItems(items)
		{
			if(!items) return;
			for(let item of items) this.addItem(item);
		},
		removeItem(item)
		{
			this.items.delete(item);
		},
		removeItems(items)
		{
			if(!items) return;
			for(let item of items) this.removeItem(item);
		}
	});

	/**
	 * Basic 2D Item for Course
	 */
	Component.Course.Item=µ.Class({
		constructor:function({element,x=0,y=0,name=""}={})
		{
			/** element that is actually visible (dom/svg/etc)*/
			this.element=element;

			if(element) Component.Course.Item._references.set(this.element,this);

			this.x=x;
			this.y=y;
			this.name=name;
		},
		setPosition(x=this.x,y=this.y)
		{
			this.x=x;
			this.y=y;
		},
		move(x=0,y=0)
		{
			this.setPosition(this.x+x,this.y+y);
		},
		destroy()
		{
			this.mega();
		}
	});
	/** keep back references from elements to instances */
	Component.Course.Item._references=new WeakMap();

	SMOD("gs.Comp.Course",Component.Course);


})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);