(function(µ,SMOD,GMOD,HMOD,SC){

	let Component=GMOD("gs.Component");
	let Event=GMOD("Event");

	SC=SC({
		rs:"rescope",
		Reporter:"EventReporterPatch"
	});

	let List=Component.List=µ.Class(Component,{
		constructor:function(data=[],mapper=List.STD_MAPPER,{columns=1,active=0,controllerMappings=List.STD_CONTROLLER_MAPPINGS,threshold}={})
		{
			SC.rs.all(this,["_step","onClick"]);

			this.mega(controllerMappings,{stickThreshold:threshold});
			let reporter=new SC.Reporter(this,[List.SelectEvent]);

			this.columns=1;
			this.data=data;
			this.mapper=mapper;

			this.active=active;

			this.domElement=document.createElement("DIV");
			this.domElement.classList.add("Component","List");

			this.setColumns(columns);

			this.movement={
				method:null,
				timer:null,
				currentTime:List.INITIAL_MOVEMENT_TIMEOUT
			};

			this.update();
			this.domElement.addEventListener("click",this.onClick);
		},
		/** updates the items from data */
		update()
		{
			while(this.domElement.firstChild) this.domElement.removeChild(this.domElement.firstChild);

			this.active=Math.min(Math.max(this.active,0),this.data.length);

			for(let index=0;index<this.data.length;index++)
			{
				let element=document.createElement("DIV");
				this.mapper(element,this.data[index],index,this.data);
				element.dataset.index=index;
				element.dataset.index=index;
				if(this.active===index) element.classList.add("active");
				this.domElement.appendChild(element);
			}
			return this;
		},
		setData(data=[])
		{
			this.data=data;
			return this;
		},
		setMapper(mapper=List.STD_MAPPER)
		{
			this.mapper=mapper;
			return this;
		},
		setColumns(columns)
		{
			this.columns=Math.max(columns,1);
			this.domElement.style.setProperty("--list-columns",this.columns);
		},
		actions:{
			move(stickEvent)
			{
				let analysis=this.analyzer.analyze(stickEvent);

				if(!analysis.pressed)
				{
					this._stopMovement();
					return;
				}
				if(analysis.pressChanged||analysis.direction4Changed)
				{
					let method=List._MOVEMENT_MAP[analysis.direction4];

					this._stopMovement();
					this.movement.method=method;
					this._step();
				}
			},
			select(buttonEvent)
			{
				let analysis=this.analyzer.analyze(buttonEvent);
				if(analysis.pressedDown&&this.active>=0&&this.active<this.data.length)
				{
					let index=this.active;
					let dom=this.domElement.children[index];
					let data=this.getActiveData();
					return this.reportEvent(new List.SelectEvent(index,dom,data));
				}
			}
		},
		_stopMovement()
		{
			clearTimeout(this.movement.timer);
			this.movement.method=null;
			this.movement.currentTime=List.INITIAL_MOVEMENT_TIMEOUT;
		},
		moveRight()
		{
			this.domElement.children[this.active].classList.remove("active");

			this.active=(this.active+1)%this.data.length;

			this.domElement.children[this.active].classList.add("active");
		},
		moveLeft()
		{
			this.domElement.children[this.active].classList.remove("active");

			if(this.active<=0)this.active=this.data.length;
			this.active--;

			this.domElement.children[this.active].classList.add("active");
		},
		moveDown()
		{
			this.domElement.children[this.active].classList.remove("active");

			if(this.active+this.columns>=this.data.length) this.active=this.active%this.columns;
			else this.active+=this.columns;

			this.domElement.children[this.active].classList.add("active");
		},
		moveUp()
		{
			this.domElement.children[this.active].classList.remove("active");

			if(this.active-this.columns<0)
			{
				let fullList=this.columns*Math.ceil(this.data.length/this.columns);
				this.active=fullList-(this.columns-this.active);
				if(this.active>=this.data.length) this.active-=this.columns;

			}
			else this.active-=this.columns;

			this.domElement.children[this.active].classList.add("active");
		},
		_step()
		{
			this.movement.method.call(this);
			this.movement.timer=setTimeout(this._step,this.movement.currentTime);
			this.movement.currentTime=Math.max(List.MIN_MOVEMENT_TIMEOUT,this.movement.currentTime/List.MOVEMENT_ACCELERATION);
		},
		destroy()
		{
			this._stopMovement();
			this.domElement.remove();
			this.mega();
		},
		onClick(event)
		{
			let dom=event.target;
			while(dom&&dom.parentNode!=this.domElement) dom=dom.parentNode;
			if(!dom) return;

			let index=dom.dataset.index;
			let data=this.data[index];
			this.reportEvent(new List.SelectEvent(index,dom,data));
		},
		getActiveData()
		{
			return this.data[this.active];
		}
	});

	List._MOVEMENT_MAP={
		"-2":List.prototype.moveDown,
		"-1":List.prototype.moveLeft,
		"0" :List.prototype.moveUp,
		"1" :List.prototype.moveRight,
		"2" :List.prototype.moveDown,
	};
	List.STD_MAPPER=(e,d)=>e.textContent=d;
	List.STD_CONTROLLER_MAPPINGS={
		"*":{
			"stick":{action:"move"},
			"button":{action:"select"}
		}
	};
	List.INITIAL_MOVEMENT_TIMEOUT=750;
	List.MIN_MOVEMENT_TIMEOUT=75;
	List.MOVEMENT_ACCELERATION=1.25;
	List.SelectEvent=µ.Class(Event,{
		name:"gs.Select",
		constructor:function(index,dom,data)
		{
			this.index=index;
			this.dom=dom;
			this.data=data;
		}
	});

	SMOD("gs.Comp.List",List);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);