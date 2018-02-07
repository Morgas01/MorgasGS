(function(µ,SMOD,GMOD,HMOD,SC){

	let Game=GMOD("gs.Game");

	SC=SC({
		rs:"rescope",
		Promise:"Promise"
	});

	let REQUEST_COUNTER=0;

	Game.Embedded=µ.Class(Game,{
		[µ.Class.symbols.abstract]:true,
		constructor:function(param={})
		{
			SC.rs.all(this,["_onMessage","_onFocus"]);

			param.domElement=document.body;

			this.mega(param);
			this.domElement.classList.add("Embedded");

			({
				timeout:this.timeout=50000
			}=param);

			this.requestMap=new Map();
			window.addEventListener("message",this._onMessage);
			window.addEventListener("focus",this._onFocus);
		},
		_send(message)
		{
			window.parent.postMessage(message,window.parent.origin);
		},
		_request(message)
		{
			message.request=REQUEST_COUNTER++;

			let timer;
			let promise=new SC.Promise(()=>
			{
				this.requestMap.set(message.request,signal);
				timer=setTimeout(()=>
				{
					signal.reject("timeout");
				},this.timeout);
			},{scope:this});
			promise.always(()=>
			{
				this.requestMap.delete(message.request);
				clearTimeout(timer);
			});
		},
		_onMessage(event)
		{
			let message=event.data;
			if("request" in message)
			{
				if(!this.requestMap.has(message.request))
				{
					µ.logger.error("#Game.Embedded:001 no such request "+message.request);
				}
				else
				{
					let signal=this.requestMap.get(event.data.request);

					if(message.error) signal.reject(error);
					else signal.resolve(message.data);
				}
			}
			else
			{
				switch(message.type)
				{
					case "pause":
						this.setPause(message.value);
						break;
					case "controllerEvent":
						this.onControllerChange(message.event);
						break;
				}
			}
		},
		save(oldSave)
		{
			return this._request({type:"save",oldSave:oldSave,state:this.state});
		},
		getSaves()
		{
			return this._request({type:"getSaves"});
		},
		_onFocus()
		{
			if(document.activeElement===document.body)
			{
				this._send({type:"reclaimFocus"});
			}
		}
	});

	SMOD("gs.Game.Embedded",Game.Embedded);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);