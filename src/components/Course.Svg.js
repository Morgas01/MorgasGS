(function(µ,SMOD,GMOD,HMOD,SC){

	let Course=GMOD("gs.Comp.Course");

	SC=SC({
		rs:"rescope",
		proxy:"proxy"
	});

	Course.Svg=µ.Class(Course,{
		constructor:function(param={})
		{
			let svg=this.domElement=document.createElementNS(Course.Svg.XMLNS,"svg");

			this.mega(param);

			this.defs=document.createElementNS(Course.Svg.XMLNS,"defs");
			svg.appendChild(this.defs);

			for(let attr of ["version","baseProfile","width","height","viewBox","preserveAspectRatio"])
			{
				Object.defineProperty(this,attr,{
					configurable:true,
					enumerable:true,
					get:()=>svg.getAttribute(attr),
					set:value=>svg.setAttribute(attr,value)
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
		addDef(svgElement)
		{
			this.defs.appendChild(svgElement);
		},
		addItem(item)
		{
			this.mega(item);
			this.domElement.appendChild(item.svgElement);
		},
		removeItem(item)
		{
			this.mega(item);
			this.domElement.removeChild(item.svgElement);
		},
		createElement(tagName)
		{
			return document.createElementNS(Course.Svg.XMLNS,tagName);
		}
	});
	Course.Svg.VERSION=1.2;
	Course.Svg.BASE_PROFILE="full";
	Course.Svg.XMLNS="http://www.w3.org/2000/svg";
	Course.Svg.createElement=Course.Svg.prototype.createElement;

	Course.Svg.Item=µ.Class(Course.Item,{
		constructor:function(param={})
		{
			let {tagName="g"}=param;
			this.mega(param);
			this.svgElement=this.createElement(tagName);
			this.setPosition();
		},
		setPosition(x,y)
		{
			this.mega(x,y);
			this.setAttribute("transform",`translate(${this.x} ${this.y})`);
		},
		getAttribute(name,value)
		{
			return this.svgElement.getAttribute(name,value)
		},
		setAttribute(name,value)
		{
			return this.svgElement.setAttribute(name,value)
		},
		createElement:Course.Svg.createElement
	});

	SMOD("gs.Comp.Course.Svg",Course.Svg);


})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);