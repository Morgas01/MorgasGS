(function(µ,SMOD,GMOD,HMOD,SC){

	let Game=GMOD("gs.Game");

	SC=SC({
		rs:"rescope"
	});

	/**
	 * Game Class to execute an gs.Game.Embedded using an iframe
	 */
	Game.Remote=µ.Class(Game,{
		[µ.Class.symbols.abstract]:function(name,url)
		{
			return {name:name,url:new URL(url,location.href)};
		},
		[µ.Class.symbols.onExtend]:function(sub)
		{
			Game.prototype[µ.Class.symbols.onExtend](sub);
			let sProt=sub.prototype;
			if(!sProt.url) throw new SyntaxError("#Game.Remote:001 Game has no url");
			if(!(sProt.url instanceof URL)) throw new SyntaxError("#Game.Remote:002 Game url is not an instance of URL");
		},
		constructor:function()
		{
			SC.rs.all(this,["_onLoad","_onMessage"]);
			this.mega({elementTag:"IFRAME"});
			this.domElement.classList.add("remote")
			this.domElement.sandbox="allow-orientation-lock allow-pointer-lock allow-scripts allow-same-origin";
			this.domElement.src=this.url;
			this.domElement.addEventListener("load",this._onLoad,false);
			this.domElement.addEventListener("message",this._onMessage,false);
		},
		_onLoad()
		{
			this.setPause(this.pause);
		},
		_onMessage(event)
		{
			if(event.origin===this.url.origin)
			{
				let message=event.data;
				let promise=null;
				switch(message.type)
				{
					case "save":
						this.state=message.state;
						promise=this.save(message.oldSave)
						break;
					case "getSaves":
						promise=this.getSaves(message.oldSave);
						break;
				}
				if(promise)
				{
					promise.then(data=>({data:data}),error=>({error:error}))
					.then(answer=>
					{
						answer.request=message.request;
						this._send(answer);
					});
				}
			}
		},
		_send(message)
		{
			if(this.domElement.contentWindow)
			{
				this.domElement.contentWindow.postMessage(message,this.url.origin);
			}
		},
		setPause(value)
		{
			this.pause=!!value;
			this._send({
				type:"pause",
				value:this.pause
			});
		},
		onControllerChange(event)
		{
			this._send({
				type:"controllerEvent",
				event:event
			});
		}
	});

	SMOD("gs.Game.Remote",Game.Remote);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);