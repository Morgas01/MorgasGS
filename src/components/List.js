(function(µ,SMOD,GMOD,HMOD,SC){

	let Component=GMOD("gs.Component");

	SC=SC({
		rs:"rescope"
	});

	let List=Component.List=µ.Class(Component,{
		constructor:function(data=[],mapper=List.STD_MAPPER,{columns=1,active=0,controllerMappings=List.STD_CONTROLLER_MAPPINGS,threshold}={})
		{
			SC.rs.all(this,["_step"]);

			this.mega(controllerMappings,{stickThreshold:threshold});

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
		},
		/** updates the items from data */
		update()
		{
			while(this.domElement.firstChild) this.domElement.removeChild(this.domElement.firstChild);

			this.active=Math.min(Math.max(this.active,0),this.data.length);

			for(let index=0;index<this.data.length;index++)
			{
				let element=document.createElement("DIV");
				this.mapper(element,this.data[index]);
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
			"stick":{
				"*":{action:"move"}
			}
		}
	};
	List.INITIAL_MOVEMENT_TIMEOUT=750;
	List.MIN_MOVEMENT_TIMEOUT=75;
	List.MOVEMENT_ACCELERATION=1.25;

	SMOD("gs.Comp.List",List);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);