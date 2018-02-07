(function(µ,SMOD,GMOD,HMOD,SC){

	let Component=GMOD("gs.Component");

	SC=SC({
		rs:"rescope"
	});

	Component.List=µ.Class(Component,{
		constructor:function(data=[],mapper=Component.STD_MAPPER,{columns=1,active=0,controllerMapping=Component.STD_CONTROLLER_MAPPING}={})
		{
			SC.rs.all(this,["_step","moveRight","moveLeft","moveDown","moveUp"]);

			this.mega(controllerMapping);

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
				currentTime:Component.INITIAL_MOVEMENT_TIMEOUT
			}

			this.update();
		},
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
		setMapper(mapper=Component.STD_MAPPER)
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
			move(stick)
			{
				let absX=Math.abs(stick.x);
				let absY=Math.abs(stick.y);

				let method;
				if(absX<33&&absY<33)
				{
					this._stopMovement();
					return;
				}
				else if(absX>=absY)
				{
					method=stick.x<0?this.moveLeft:this.moveRight;
				}
				else
				{
					method=stick.y<0?this.moveDown:this.moveUp;
				}

				if(method!=this.movement.method)
				{
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
			this.movement.currentTime=Component.INITIAL_MOVEMENT_TIMEOUT;
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
			this.movement.currentTime=Math.max(Component.MIN_MOVEMENT_TIMEOUT,this.movement.currentTime/Component.MOVEMENT_ACCELERATION);
		}
	});

	Component.STD_MAPPER=(e,d)=>e.textContent=d;
	Component.STD_CONTROLLER_MAPPING=new Map([[null,{
		"stick":{
			"null":"move"
		}
	}]]);
	Component.INITIAL_MOVEMENT_TIMEOUT=800;
	Component.MIN_MOVEMENT_TIMEOUT=125;
	Component.MOVEMENT_ACCELERATION=1.2;

	SMOD("gs.Component.List",Component.List);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);