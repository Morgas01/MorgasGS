(function(µ,SMOD,GMOD,HMOD,SC){

	let Course=GMOD("gs.Comp.Course");

	SC=SC({
		rs:"rescope",
		proxy:"proxy"
	});

	Course.Svg=µ.Class(Course,{
		constructor:function(param={})
		{
			if(!param.domElement) param.domElement=Course.Svg.createElement("svg");

			this.mega(param);

			this.defs=Course.Svg.createElement("defs");
			this.domElement.appendChild(this.defs);

			for(let attr of ["version","baseProfile","width","height","viewBox","preserveAspectRatio"])
			{
				Object.defineProperty(this,attr,{
					configurable:true,
					enumerable:true,
					get:()=>this.domElement.getAttribute(attr),
					set:value=>this.domElement.setAttribute(attr,value)
				});
			};

			this.version=Course.Svg.VERSION;
			this.baseProfile=Course.Svg.BASE_PROFILE;

			({
				width:this.width=null,
				height:this.height=null,
				preserveAspectRatio:this.preserveAspectRatio="none",

				viewTop:param.viewTop=0,
				viewLeft:param.viewLeft=0,
				viewWidth:param.viewWidth=this.width==null?this.width:100,
				viewHeight:param.viewHeight=this.height==null?this.height:100,
				viewBox:this.viewBox=param.viewTop+" "+param.viewLeft+" "+param.viewWidth+" "+param.viewHeight
			}=param);

		},
		addDef(element)
		{
			this.defs.appendChild(element);
		},
		addItem(item)
		{
			this.mega(item);
			this.domElement.appendChild(item.element);
		},
		removeItem(item)
		{
			this.mega(item);
			this.domElement.removeChild(item.element);
		},
	});
	Course.Svg.VERSION=1.2;
	Course.Svg.BASE_PROFILE="full";
	Course.Svg.XMLNS="http://www.w3.org/2000/svg";
	Course.Svg.createElement=function(tagName,attributes={})
	{
		let element=document.createElementNS(Course.Svg.XMLNS,tagName);

		for(let [attr,value] of Object.entries(attributes))
		{
			element.setAttribute(attr,value);
		}
		return element;
	};

	Course.Svg.Item=µ.Class(Course.Item,{
		constructor:function(param={})
		{
			if(!param.element) param.element=Course.Svg.createElement(param.tagName||"g",param.attributes)
			this.mega(param);

			this.autoUpdate=false;

			this.setPosition();

			this.autoUpdate=param.autoUpdate!==false;
		},
		setPosition(x,y)
		{
			this.mega(x,y);
			if(this.autoUpdate) this.update();
		},
		update()
		{
			this.element.setAttribute("transform",`translate(${this.x} ${this.y})`);
		},
		destroy()
		{
			this.element.remove();
			this.mega();
		}
	});

	SMOD("gs.Comp.Course.Svg",Course.Svg);


})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);