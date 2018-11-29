(function(µ,SMOD,GMOD,HMOD,SC){

	let gs=µ.gs=µ.gs||{};

	SC=SC({
		Consumer:"gs.Con.Consumer",
		Analyzer:"gs.Con.Analyzer"
	});

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
		constructor:function(mapping=null,analyzerOptions)
		{
			new SC.Consumer(this,this.actions,mapping);
			this.analyzer=new SC.Analyzer(analyzerOptions);
		},
		/** @type {Object.<String,Function>} */
		actions:{},
	});

	SMOD("gs.Component",gs.Component);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);