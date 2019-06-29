(function(µ,SMOD,GMOD,HMOD,SC){

	let Component=GMOD("gs.Component");
	let Event=GMOD("Event");

	SC=SC({
		rs:"rescope",
		Reporter:"EventReporterPatch"
	});

	let TextBox=Component.TextBox=µ.Class(Component,{
		constructor:function(parts=[],{controllerMappings=TextBox.STD_CONTROLLER_MAPPINGS,styleClasses=[]}={})
		{
			SC.rs.all(this,["stepParts","onClick"]);

			this.mega(controllerMappings);
			let reporter=new SC.Reporter(this,[TextBox.FinishedEvent]);

			this.parts=TextBox.Part.create(parts);
			this.partIndex=0;
			this.running=null;
			this.skiping=false;

			this.domElement=document.createElement("DIV");
			this.domElement.classList.add("Component","TextBox",...styleClasses);
		},
		nextPart()
		{
			if(this.running!=null) return this.running;
			let activePart=this.parts[this.partIndex];
			if(activePart==null)
			{
				this.domElement.classList.add("Finished");
				this.reportEvent(new TextBox.FinishedEvent());
				return Promise.resolve();
			}

			this.domElement.appendChild(activePart.domElement);

			if(this.skiping) this.running=activePart.skip();
			else this.running=activePart.animate();

			return this.running.catch(µ.logger.error).then(()=>
			{
				this.running=null;
				this.partIndex++;
				if(!(activePart instanceof TextBox.Part.WayPoint)||this.skiping)
				{
					return this.nextPart();
				}
			});
		},
		skipParts()
		{
			this.skiping=true;
			if(this.running)
			{
				let activePart=this.parts[this.partIndex];
				activePart.skip();
				return this.running;
			}
			return this.nextPart();
		},
		actions:{
			skip(event)
			{
				let analysis=this.analyzer.analyze(stickEvent);
				if(analysis.pressed&&analysis.pressChanged)
				{
					this.skipParts();
				}
			},
			next(event)
			{
				let analysis=this.analyzer.analyze(stickEvent);
				if(analysis.pressed&&analysis.pressChanged)
				{
					this.nextPart();
				}
			}
		}
	});

	TextBox.FinishedEvent=Event.implement("gs.FinishedEvent");

	/**
	 * Parts of a TextBox must implement a skip function
	 * animate starts the animation of its content
	 * skip ends animation and displays the end content
	 */
	TextBox.Part=µ.Class({
		[µ.Class.symbols.abstract]:true,
		[µ.Class.symbols.onExtend]:function(sub)
		{
			let newPartType=sub.prototype.type
			if(!newPartType) throw new SyntaxError("#TextBox.Part:001 no type defined for subclass");
			if(!sub.prototype[µ.Class.symbols.abstract])
			{
				if(typeof sub.prototype.skip!="function") throw new SyntaxError("#TextBox.Part:002 no skip function implemented");
			}
			if(TextBox.Part.Types.has(newPartType)) µ.logger.warn("#TextBox.Part:003 overwriting existing class "+newPartType);
			TextBox.Part.Types.set(newPartType,sub);
		},
		constructor:function({tagName="SPAN",styleClasses=[]}={})
		{
			this.domElement=document.createElement(tagName);
			this.domElement.classList.add("TextBox-Part-"+this.type,...styleClasses);
		},
		/** animates content */
		async animate(){return this.skip()},
		/** skips/ends animation and displays end content */
		async skip(){}
	});
	TextBox.Part.Types=new Map();
	TextBox.Part.create=function(partsJson,ignoreMissing=true)
	{
		let types=TextBox.Part.Types;
		let rtn=[];
		for(let entry of partsJson)
		{
			if(entry instanceof TextBox.Part)
			{
				rtn.push(entry);
			}
			else if(!types.has(entry.type))
			{
				let msg="#TextBox.Part:004 missing TextBox Part Type: "+entry.type;
				if(ignoreMissing) µ.logger.warn(msg);
				else throw new RangeError(msg)
			}
			else
			{
				rtn.push(new (types.get(entry.type))(entry));
			}
		}
		return rtn;
	};

	TextBox.Part.Text=µ.Class(TextBox.Part,{
		type:"text",
		constructor:function({text,styleClasses=[],interval=75})
		{
			this.mega({tagName:"SPAN",styleClasses});
			this.text=text;
			this.interval=interval;
			this.resolve=null;
		},

		animate()
		{
			return new Promise(resolve=>
			{
				this.resolve=resolve;
				this.domElement.textContent+=this.text[0];
				let timer=setInterval(()=>
				{
					let length=this.domElement.textContent.length;
					if(length<this.text.length)
					{
						this.domElement.textContent+=this.text[length];
					}
					else
					{
						clearInterval(timer);
						resolve();
					}
				},this.interval);
			});
		},
		async skip()
		{
			this.domElement.textContent=this.text;
		}
	});

	TextBox.Part.WayPoint=µ.Class(TextBox.Part,{
		type:"waypoint",
		constructor:function({text,styleClasses=[],interval=75})
		{
			this.mega({tagName:"SPAN",styleClasses});
		}
	});

	TextBox.Part.Pause=µ.Class(TextBox.Part,{
		type:"pause",
		constructor:function({text,styleClasses=[],duration=800})
		{
			this.mega({tagName:"SPAN",styleClasses});
			this.duration=duration;
			this.resolve=null;
		},

		animate()
		{
			return new Promise(resolve=>
			{
				this.resolve=resolve;
				let timer=setTimeout(resolve,this.duration);
			});
		},
		async skip()
		{
			if(this.resolve) this.resolve()
		}
	});

	SMOD("gs.Comp.TextBox",TextBox);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);