(function(µ,SMOD,GMOD,HMOD,SC) {

	let Controller=GMOD("gs.Controller");
	let Patch=GMOD("Patch");

	//SC=SC({});

	/**
	 * Mapping from controller ID to {@link ControllerConsumer~controllerMapping controllerMapping}.
	 * A mapping for "" (empty string) is the default mapping
	 * @typedef {Object.<String,ControllerConsumer~controllerMapping} ControllerConsumer~mapping
 	 */
	/**
	 * Mappings for {@link Controller.ChangeEvent} types.
	 * Inside each mapping is a mapping for the input index to the task.
	 * A mapping for input index "" (empty string) is the default mapping
	 * @typedef {Object}ControllerConsumer~controllerMapping
	 * @property {Object.<String,ControllerConsumer~controllerMappingTask>} (button)
	 * @property {Object.<String,ControllerConsumer~controllerMappingTask>} (axis)
	 * @property {Object.<String,ControllerConsumer~controllerMappingTask>} (stick)
	 */
	/** @typedef {Object} ControllerConsumer~controllerMappingTask
	 * @property {String} action - component action
	 * @property {Any} (data) - additional data for the component action
	 */

	let ControllerConsumer=Controller.Consumer=µ.Class(Patch,{
		patch:function(actions,mapping={},keys=ControllerConsumer.defaultKeys)
		{
			this.actions=actions;
			/** @type {ControllerConsumer~mapping}*/
			this.mapping=mapping;
			this.composeInstance(keys);
		},
		composeKeys:["setMapping","addControllerMapping","consumeControllerChange"],
		/**
		 * @param {ControllerConsumer~mapping} mapping
		 */
		setMapping(mapping)
		{
			this.mapping=mapping;
		},
		/**
		 * @param {String} controllerID
		 * @param {String} type
		 * @param {String} index
		 * @param {String} action
		 * @param {Any} [data]
		 * @returns {gs.ControllerConsumer}
		 */
		addControllerMapping(controllerID,type,index,action,data)
		{
			if(!this.mapping[controllerID])
			{
				this.mapping[controllerID]={};
			}
			let mapping=this.mapping[controllerID];
			if(!mapping[type]) mapping[type]={};
			mapping[type][index]={action:action,data:data};
		},
		/**
		 * @param {gs.Controller.ChangeEvent} event
		 * @returns {boolean} consumed
		 */
		consumeControllerChange(event)
		{
			let mapping=this.mapping[event.controllerID];
			if(!mapping)
			{
				mapping=this.mapping["*"];
			}
			if(mapping&&mapping[event.type])
			{
				let typeMapping=mapping[event.type];
				let task=typeMapping[event.index]||typeMapping["*"];
				if(task&&task.action in this.actions)
				{
					let action=this.actions[task.action];
					action.call(this.instance,event,task.data);
					return true;
				}
			}
			return false;
		}
	});
	ControllerConsumer.defaultKeys={
		setMappings:"setmapping",
		consumeControllerChange:"consumeControllerChange"
	};

	SMOD("gs.Con.Consumer",ControllerConsumer);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);