(function(µ,SMOD,GMOD,HMOD,SC){

	let gs=µ.gs=µ.gs||{};

	//SC=SC({});

	/** @typedef {Object} controllerMapping_task
	 * @property {String} action
	 * @property {Any} (data)
	 */
	/** @typedef {Object} controllerMapping
	 * @property {Object.<Number,controllerMapping_task>} (button)
	 * @property {Object.<Number,controllerMapping_task>} (axis)
	 * @property {Object.<Number,controllerMapping_task>} (stick)
	 */

	gs.Component=µ.Class({
		[µ.Class.symbols.abstract]:true,
		constructor:function(controllerMappings=new Map())
		{
			/** @type {Map.<Number,controllerMapping>} */
			this.controllerMappings=controllerMappings;
			/** @type {WeakMap.<Number,Set<Number>>} */
			this.pressedButtons=new WeakMap();
		},
		addControllerMapping(controllerID,type,index,action,data)
		{
			if(!this.controllerMappings.has(controllerID))
			{
				this.controllerMappings.set(controllerID,{});
			}
			let mapping=this.controllerMappings.get(controllerID);
			if(!mapping[type]) mapping[type]={};
			mapping[type][index]={action:action,data:data};
			return this;
		},
		/** @type {Object.<String,Function>} */
		actions:{},
		/**
		 * @param {gs.Controller.ChangeEvent} event
		 * @returns {boolean} consumed
		 */
		consumeControllerChange(event)
		{
			let mapping=this.controllerMappings.get(event.controllerID);
			if(!mapping)
			{
				mapping=this.controllerMappings.get(null);
			}
			if(mapping&&mapping[event.type])
			{
				let typeMapping=mapping[event.type];
				let task=typeMapping[event.index]||typeMapping[null];
				if(task&&task.action in this.actions)
				{
					let action=this.actions[task.action];
					action.call(this,event.value,task.data,event);
					return true;
				}
			}
			return false;
		},
		/**
		 * keeps track of pressed buttons and returns true if a button was pressed now
		 * @protected
		 * @param {gs.Controller.ChangeEvent} event
		 * @returns {Boolean} button pressed now
		 */
		_acceptButton(event)
		{
			if(!button.pressed)
			{
				this.pressedButtons.delete(event.index);
				return false;
			}
			else if(!this.pressedButtons.has(event.index))
			{
				this.pressedButtons.add(event.index);
				return true;
			}
		}
	});

	SMOD("gs.Component",gs.Component);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);