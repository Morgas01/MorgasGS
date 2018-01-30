(function(µ,SMOD,GMOD,HMOD,SC){

	let gs=µ.gs=µ.gs||{};

	//SC=SC({});

	/** @typedef {Object} controllerMapping
	 * @property {Object.<Number,String>} (button)
	 * @property {Object.<Number,String>} (axis)
	 * @property {Object.<Number,String>} (stick)
	 */

	gs.Component=µ.Class({
		[µ.Class.symbols.abstract]:true,
		constructor:function(controllerMapping=new Map())
		{
			/** @type {Map.<Controller,controllerMapping>} */
			this.controllerMapping=controllerMapping;
			/** @type {WeakMap.<Controller,Set<Number>>} */
			this.pressedButtons=new WeakMap();
		},
		addControllerMapping(controller,type,index,action)
		{
			if(!this.controllerMapping.has(controller))
			{
				this.controllerMapping.set(controller,{});
			}
			let mapping=this.controllerMapping.get(controller);
			if(!mapping[type]) mapping[type]={};
			mapping[type][index]=action;
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
			let mapping=this.controllerMapping.get(event.controller);
			if(!mapping)
			{
				mapping=this.mappings.get(null);
			}
			if(mapping&&mapping[event.type])
			{
				let typeMapping=mapping[event.type];
				let indexMapping=typeMapping[event.index]||typeMapping[null];
				if(indexMapping&&indexMapping in this.actions)
				{
					let action=this.actions[indexMapping];
					action.call(this,event.value,event);
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