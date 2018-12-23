(function MorgasInit(oldµ){
	Morgas={version:"0.8.7"};
	µ=Morgas;
	/**
	 * revert "µ" to its old value
	 */
	µ.revert=function()
	{
		return µ=oldµ;
	};

	µ.constantFunctions={
		"ndef":function(){return undefined},
		"n":function(){return null},
		"f":function(){return false},
		"t":function(){return true},
		"zero":function(){return 0},
		"es":function(){return ""},
		"boolean":function(val){return !!val},
		"pass":function(a){return a},
		"scope":function(){return this}
	};

	/** Modules
	 *	Every class and utility function should define a Module, which can
	 *	be replaced by any other function or class that has similar structure.
	 *
	 */

	{
		let modules={};
		µ.setModule=function(key,value)
		{
			if(modules[key])
			{
				µ.logger.warn("#setModule:001 "+key+" is overwritten");
			}
			return modules[key]=value;
		};
		µ.hasModule=function(key)
		{
			return !!modules[key];
		};
		µ.getModule=function(key)
		{
			if(!modules[key]) throw new Error("#getModule:001 "+key+" is not defined");
			return modules[key];
		};
	};

	/**
	 * log message if it's verbose is >= the current verbose.
	 * If a message is a function its return value will be logged.
	 *
	 * Set µ.logger.out to any function you like to log the events and errors.
	 * µ.logger.out will be called with (verbose level, [messages...])
	 */
	µ.logger={
		log:function(verbose,...msgs)
		{
			if(!verbose||verbose<=0) return;
			if(µ.logger.verbose>=verbose)
			{
				µ.logger.out(verbose,msgs);
			}
		},
		LEVEL:{
				//off:0, - set after log method generation
				error:10,
				warn:20,
				info:30,
				debug:40,
				trace:50
		},
		verbose:30,
		getLevel:function(){return µ.logger.verbose},
		setLevel:function(level){µ.logger.verbose=level},
		/**
		 * @param {Number}	verbose
		 * @param {Array}	msgs
		 */
		out:function(verbose,msgs)
		{
			var fn;
			if(verbose<=µ.logger.LEVEL.error) fn=console.error;
			else if(verbose<=µ.logger.LEVEL.warn) fn=console.warn;
			else if(verbose<=µ.logger.LEVEL.info) fn=console.info;
			else fn=console.log;

			fn.apply(console,msgs);
		}
	};
	//create methods for each level (e.g. µ.logger.warn)
	Object.keys(µ.logger.LEVEL).forEach(function(level)
	{
		µ.logger[level]=function(...args)
		{
			args.unshift();
			µ.logger.log.call(null,µ.logger.LEVEL[level],...args);
		}
	});
	µ.logger.LEVEL.off=0;

	/** shortcut
	 * creates/modifies an object that will evaluate its values defined in {map} on its first call.
	 *
	 *
	 * @param {Object} map	-	{key:("moduleOrPath",function)}
	 * @param {Object} [target={}]	-	{} (optional)
	 * @param {Any} [context] - argument for getter functions
	 * @param {Boolean} {dynamic=false] - don't cache evaluations
	 *
	 * returns {key:value}
	 */
	µ.shortcut=function(map,target,context,dynamic)
	{
		if(!target)
		{
			target={};
		}
		Object.entries(map).forEach(([key,path])=>
		{
			Object.defineProperty(target,key,{
				configurable:true,
				enumerable:true,
				get:function()
				{
					let value=undefined;

					if(typeof path=="function") value=path.call(this,context);
					else if (µ.hasModule(path)) value=µ.getModule(path);
					else throw new ReferenceError("#shortcut:001 could not evaluate "+path);

					if(value!=null&&!dynamic)
					{//replace getter with actual value
						Object.defineProperty(this,key,{value});
					}
					return value;
				}
			});
		});
		return target;
	};
	let CLASS_PROXY={
		construct:function(target,argumentList)
		{
			if(target.prototype.hasOwnProperty(µ.Class.symbols.abstract)) throw new Error("#Class:001 can not instantiate abstract class");

			let instance=new target(...argumentList);
			if(µ.Class.symbols.afterConstruct in target.prototype)
			{
				target.prototype[µ.Class.symbols.afterConstruct].call(instance,...argumentList)
			}
			return instance;
		}
	};


	/** Class function
	 * Designed to create JavaScript Classes
	 *
	 * It does the inheritance, and wires some hooks and defreezes the constructor method.
	 * If only 1 argument is passed it will be handled as the newClass.
	 *
	 * @param {Function} (superClass)
	 * @param {Function|Object} newClass
	 * @return {Function}
	 */
	µ.Class=function ClassFunc(superClass,newClass)
	{
		if(arguments.length==1)
		{
			newClass=superClass;
			superClass=µ.BaseClass;
		}

		if(typeof newClass=="object")
		{
			if(!newClass.hasOwnProperty("constructor"))
			{
				if(!superClass) newClass.constructor=function(){};
				else newClass.constructor=function(...args){superClass.call(this,...args)};
			}
			newClass.constructor.prototype=newClass;
			newClass=newClass.constructor;
		}
		else if (!newClass)
		{
			newClass=function(){};
		}

		if(superClass) //only undefined when creating BaseClass
		{
			let prot=Object.create(superClass.prototype);
			Object.assign(prot,newClass.prototype);
			prot.constructor=newClass;
			newClass.prototype=prot;
		}

		if(newClass.prototype.hasOwnProperty(µ.Class.symbols.abstract) && typeof newClass.prototype[µ.Class.symbols.abstract]==="function")
		{
			newClass.implement=function(...args)
			{
				return µ.Class(newClass,newClass.prototype[µ.Class.symbols.abstract](...args));
			};
		}

		let classProxy=new Proxy(newClass,CLASS_PROXY)

		if(superClass&&µ.Class.symbols.onExtend in superClass.prototype&&!newClass.prototype.hasOwnProperty(µ.Class.symbols.abstract))
		{
			superClass.prototype[µ.Class.symbols.onExtend](classProxy);
		}
		return classProxy;
	};
	µ.Class.symbols={
		"onExtend":Symbol("onExtend"),
		"abstract":Symbol("abstract"),
		"afterConstruct":Symbol("afterConstruct")
	};


	let megaSymbol=Symbol("mega");
	/** Base Class
	 *	allows to check of being a class ( foo instanceof µ.BaseClass )
	 *	provides mega and basic destroy method
	 */
	µ.BaseClass=µ.Class({
		/**
		 * calls same function from prototype chain as the caller
		 */
		mega:function mega()
		{
			let isFirstCall=false,rtn;
			// check if it is the same as the las one
			if(this[megaSymbol]!==undefined&&this.mega.caller!==this[megaSymbol].prot[this[megaSymbol].key])
			{
				delete this[megaSymbol];
			}
			//search for key and prototype of the caller
			if(this[megaSymbol]===undefined)
			{
				isFirstCall=true;
				searchPrototype:for(let prot=Object.getPrototypeOf(this);prot!==null;prot=Object.getPrototypeOf(prot))
				{
					for(let i=0,names=Object.getOwnPropertyNames(prot);i<names.length;i++)
					{
						if(this.mega.caller===prot[names[i]])
						{
							this[megaSymbol]={
								key:names[i],
								prot:prot
							};
							break searchPrototype;
						}
					}
				}
				if(this[megaSymbol]===undefined)
				{
					µ.logger.error(new ReferenceError("caller was not a member"));
					return;
				}
			}
			let nextPrototype=Object.getPrototypeOf(this[megaSymbol].prot);
			let functionName=this[megaSymbol].key
			//go to next prototype with functionName defined
			while(nextPrototype!==null&&!nextPrototype.hasOwnProperty(functionName))
			{
				nextPrototype=Object.getPrototypeOf(nextPrototype);
			};
			var error=null;
			try
			{
				if(nextPrototype===null)
				{
					µ.logger.error(new ReferenceError("no mega found for "+this.__megaKey));
				}
				else
				{
					this[megaSymbol].prot=nextPrototype;
					rtn=nextPrototype[functionName].apply(this,arguments);
				}
			}
			catch (e){error=e;}
			if(isFirstCall)
			{
				delete this[megaSymbol];
				if(error)µ.logger.error(error);
			}
			if(error) throw error;
			return rtn;
		},
		destroy()
		{
			if(µ.hasModule("Patch"))
			{
				µ.getModule("Patch").getPatches(this).forEach(p=>p.destroy());
			}
			for(var i in this)
			{
				delete this[i];
			}
			Object.setPrototypeOf(this,null);
		}
	});
})(this.µ);

/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		prom:"Promise"
	});
	
	let DB=µ.DB=µ.DB||{};
	
	let DBC,DBOBJECT,REL,FIELD;
	
	DBC=DB.Connector=µ.Class(
	{
		[µ.Class.symbols.onExtend]:function(sub)
		{
			if(typeof sub.prototype.load!="function") throw new Error("#DB.Connector:001 load() is not defined");
			if(typeof sub.prototype.save!="function") throw new Error("#DB.Connector:002 save() is not defined");
			if(typeof sub.prototype.delete!="function") throw new Error("#DB.Connector:003 delete() is not defined");
		},
		constructor:function()
		{
			SC.prom.pledgeAll(this,["save","load","delete","destroy"]);
		},
		/*
		save:function(signal,objs)
		{
			objs=[].concat(objs);
			let sortedObjs=DBC.sortObjs(objs);
		},
		load:function(signal,objClass,pattern)
		{
		},
		"delete":function(signal,objClass,toDelete)
		{
			let toDelete=DBC.getDeletePattern(objClass,toDelete);
		},
		*/
		
		/* these should be same for everyone*/
		saveChildren:function(obj,relationName)
		{
			return this.save(obj.getChildren(relationName));
		},
		saveFriendships:function(obj,relationName)
		{
			let rel=obj.relations[relationName],
				friends=obj.friends[relationName];
			if(!friends)
			{
				µ.logger.warn("no friends in relation "+relationName+" found");
				return new SC.prom.resolve(false,this);
			}
			let fRel=friends[0].relations[rel.targetRelationName],
				id=obj.ID;
			if(id==null)
			{
				µ.logger.warn("friend id is null");
				return new SC.prom.resolve(false,this);
			}
			let fids=[];
			for(let i=0;i<friends.length;i++)
			{
				let fid=friends[i].ID;
				if(fid!=null)
					fids.push(fid);
			}
			if(fids.length===0)
			{
				µ.logger.warn("no friend with friend id found");
				return new SC.prom.resolve(false,this);
			}
			let tableName=DBC.getFriendTableName(obj.objectType,relationName,friends[0].objectType,rel.targetRelationName),
				idName=obj.objectType+"_ID",
				fidName=friends[0].objectType+"_ID",
				toSave=[];
			if (rel.relatedClass===fRel.relatedClass)
			{
				fidName+=2;
			}
			let friendship=DBFRIEND.implement(obj,relationName);
			for(let i=0;i<fids.length;i++)
			{
				toSave.push(new friendship(id,fids[i]));
			}
			return this.save(toSave);
		},
		
		loadParent:function(child,relationName)
		{
			let relation=child.relations[relationName],
				parentClass=relation.relatedClass,
				fieldName=relation.fieldName,
				targetRelationName=relation.targetRelationName;
			return this.load(parentClass,{ID:child.getValueOf(fieldName)}).then(function(result)
			{
				let parent=result[0];
				if(parent)
				{
					if(targetRelationName) parent.addChild(targetRelationName,child);
					else child.setParent(relationName,parent);
				}
				return parent;
			});
		},
		loadChildren:function(obj,relationName,pattern)
		{
			let relation=obj.relations[relationName],
				childClass=relation.relatedClass,
				childRelation=new childClass().relations[relation.targetRelationName],
				fieldName=childRelation.fieldName;

			pattern=pattern||{};
			pattern[fieldName]=obj.ID;

			return this.load(childClass,pattern).then(function(children)
			{
				obj.addChildren(relationName,children);
				return children;
			});
		},
		loadFriends:function(obj,relationName,pattern)
		{
			let friendship=DBFRIEND.implement(obj,relationName);
			let fPattern={};
			fPattern[friendship.prototype.objFieldname]=obj.ID;

			let p=this.load(friendship,fPattern);
			
			if (friendship.prototype.objClass===friendship.prototype.friendClass)
			{
				p=p.then(function(results)
				{
					fPattern[friendship.prototype.friendFieldname]=fPattern[friendship.prototype.objFieldname];
					delete fPattern[friendship.prototype.objFieldname];
					return this.load(friendship,fPattern).then(function(results2)
					{
						for(let i=0;i<results2.length;i++)
						{
							let t=results2[i].fields[friendship.prototype.objFieldname].value;
							results2[i].fields[friendship.prototype.objFieldname].value=results2[i].fields[friendship.prototype.friendFieldname].value;
							results2[i].fields[friendship.prototype.friendFieldname].value=t;
						}
						return results.concat(results2);
					});
				});
			}
			p=p.then(function(results)
			{
				if(results.length>0)
				{
					pattern=pattern||{};
					pattern.ID=results.map(function(val)
					{
						return val.fields[friendship.prototype.friendFieldname].value;
					});
					return this.load(friendship.prototype.friendClass,pattern);
				}
				else return [];
			});
			return p;
		},
		deleteFriendships:function(obj,relationName)
		{
			let rel=obj.relations[relationName],
				friends=obj.friends[relationName];
			if(!friends)
			{
				SC.debug("no friends in relation "+relationName+" found",2);
				return new SC.prom.resolve(false,this);
			}
			let fRel=friends[0].relations[rel.targetRelationName],
				id=obj.ID;
			if(id==null)
			{
				µ.logger.warn("object's id is null",2);
				return new SC.prom.resolve(false,this);
			}
			let fids=[];
			for(let i=0;i<friends.length;i++)
			{
				let fid=friends[i].ID;
				if(fid!=null)
					fids.push(fid);
			}
			if(fids.length===0)
			{
				µ.logger.warn("no friend with friend id found");
				return new SC.prom.resolve(false,this);
			}
			let friendship=DBFRIEND.implement(obj,relationName),
				toDelete=[];
			if (friendship.prototype.objClass===friendship.prototype.friendClass)
			{
				let pattern={};
				pattern[friendship.prototype.objFieldname]=fids;
				pattern[friendship.prototype.friendFieldname]=id;
				toDelete.push(pattern);
			}
			let pattern={};
			pattern[friendship.prototype.objFieldname]=id;
			pattern[friendship.prototype.friendFieldname]=fids;
			toDelete.push(pattern);

			return SC.prom.wrap(Promise.all(toDelete.map(p=>
				this.delete(friendship,p)
				.catch(µ.constantFunctions.pass)
			)),this);
		},
		connectFriends:function(dbObjects)
		{
			throw "TODO";
		}
	});

	DBC.sortObjs=function(objs)
	{
		let rtn={friend:{},fresh:{},preserved:{}};
		for(let i=0;i<objs.length;i++)
		{
			let obj=objs[i],
			type=(obj instanceof DBFRIEND ? "friend" :(obj.ID===null ? "fresh" : "preserved")),
			objType=obj.objectType;
			
			if(rtn[type][objType]===undefined)
			{
				rtn[type][objType]=[];
			}
			rtn[type][objType].push(obj);
		}
		return rtn;
	};

	//make toDelete a Pattern from Number, DB.Object or Array
	DBC.getDeletePattern=function(objClass,toDelete)
	{
		if(typeof toDelete==="number" || toDelete instanceof DB.Object)
		{
			toDelete=[toDelete];
		}
		if(Array.isArray(toDelete))
		{
			let ids=[];
			for(let i=0;i<toDelete.length;i++)
			{
				if(toDelete[i] instanceof objClass)
				{
					ids.push(toDelete[i].ID);
				}
				else if (typeof toDelete[i]==="number") ids.push(toDelete[i]);
			}
			toDelete={ID:ids};
		}
		return toDelete;
	};
	DBC.getFriendTableName=function(objType,relationName,friendType,friendRelationName)
	{
		return [objType,relationName,friendType,friendRelationName].sort().join("_");
	};
	SMOD("DBConn",DBC);

	DBOBJECT=DB.Object=µ.Class(
	{
		[µ.Class.symbols.onExtend]:function(sub)
		{
			if(sub.prototype.objectType==null) throw new SyntaxError("#DB.Object:001 objectType is not defined");
			if(DBOBJECT.classesMap.has(sub.prototype.objectType)) throw new RangeError("#DB.Object:002 objectType mut be unique");
		},
		[µ.Class.symbols.abstract]:true,
		constructor:function(param={})
		{
			this.fields={};
			
			this.relations={};
			this.parents={};	//n:1
			this.children={};	//1:n
			this.friends={};	//n:m
			
			this.addField("ID",FIELD.TYPES.INT,param.ID,{UNIQUE:true,AUTOGENERATE:true});
		},
		addRelation:function(name,relatedClass,type,targetRelationName,fieldName)
		{
			this.relations[name]=new REL(relatedClass,type,targetRelationName||name,fieldName);
			if(type===REL.TYPES.PARENT)
			{
				this.fields[fieldName]=new REFERENCEFIELD(this,name);
				Object.defineProperty(this,fieldName,{
					configurable:false,
					enumerable:true,
					get:()=>this.getValueOf(fieldName),
					set:v=>this.setValueOf(fieldName,v)
				});
			}
		},
		addField:function(name,type,value,options)
		{
			this.fields[name]=new FIELD(type,value,options);
			Object.defineProperty(this,name,{
				configurable:false,
				enumerable:true,
				get:()=>this.getValueOf(name),
				set:v=>this.setValueOf(name,v)
			});
		},
		getValueOf:function(fieldName){return this.fields[fieldName].getValue();},
		setValueOf:function(fieldName,val){this.fields[fieldName].setValue(val);},
		getParent:function(relationName)
		{
			return this.parents[relationName];
		},
		setParent:function(relationName,parent)
		{
			let rel=this.relations[relationName];
			this.parents[relationName]=parent;
			this.setValueOf(rel.fieldName,null);
		},
		_add:function(container,relationName,value)
		{
			let c=container[relationName]=container[relationName]||[];
			if(c.indexOf(value)==-1)
				c.push(value);
		},
		_get:function(container,relationName)
		{
			return (container[relationName]||[]).slice(0);
		},
		addChild:function(relationName,child)
		{
			if(this.relations[relationName].type==REL.TYPES.CHILD)
			{
				this._add(this.children,relationName,child);
				child.setParent(this.relations[relationName].targetRelationName,this);
			}
		},
		addChildren:function(relationName,children)
		{
			for(let i=0;i<children.length;i++)
			{
				this.addChild(relationName,children[i]);
			}
		},
		getChildren:function(relationName)
		{
			return this._get(this.children,relationName);
		},
		removeChild:function(relationName,child)
		{
			if(relationName in this.relations)
			{
				let rel=this.relations[relationName];
				let container=this.children[relationName];
				if(container)
				{
					let index=container.findIndex(c=>c===child||(c.objectType===child.objectType&&c.ID==child.ID));
					if(index!==-1) container.splice(index,1);
				}

				let cRel=child.relations[rel.targetRelationName];
				if(child.getValueOf(cRel.fieldName)===this.ID) child.setParent(rel.targetRelationName,null);
			}
		},
		addFriend:function(relationName,friend)
		{
			if(this.relations[relationName].type==REL.TYPES.FRIEND)
			{
				this._add(this.friends,relationName,friend);
				friend._add(friend.friends,this.relations[relationName].targetRelationName,this);
			}
		},
		addFriends:function(relationName,friends)
		{
			for(let i=0;i<friends.length;i++)
			{
				this.addFriend(relationName,friends[i]);
			}
		},
		getFriends:function(relationName)
		{
			return this._get(this.friends,relationName);
		},
		connectObjects:function(dbObjects)
		{
			let relationKeys=Object.keys(this.relations);
			for(let i=0;i<relationKeys.length;i++)
			{
				let relation=this.relations[relationKeys[i]];

				if(relation.type===REL.TYPES.FRIEND) continue; // use DBConn //TODO search for DBFriend

				for(let dbObject of dbObjects)
				{
					if(dbObject instanceof relation.relatedClass)
					{
						let parent,child,childRelation,childRelationName;
						switch (relation.type)
						{
							case REL.TYPES.PARENT:
								child=this;
								childRelation=relation;
								childRelationName=relation.targetRelationName;
								parent=dbObject;
								break;
							case REL.TYPES.CHILD:
								child=dbObject;
								childRelationName=relationKeys[i];
								childRelation=dbObject.relations[relation.targetRelationName];
								parent=this;
								break;
						}
						if(child.getValueOf(childRelation.fieldName)==parent.ID)
						{
							parent.addChild(childRelationName,child);
						}
					}
				}
			}
		},
		toJSON:function()
		{
			let rtn={};
			for(let f in this.fields)
			{
				let value=this.fields[f].toJSON();
				if(value!=null)rtn[f]=value;
			}
			return rtn;
		},
		fromJSON:function(jsonObject)
		{
			for(let i in this.fields)
			{
				if(jsonObject[i]!==undefined)
				{
					this.fields[i].fromJSON(jsonObject[i]);
				}
			}
			return this;
		},
		toString:function()
		{
			return JSON.stringify(this);
		}
	});
	DBOBJECT.connectObjects=function(dbObjects)
	{
		for(let i=0;i<dbObjects.length;i++)
		{
			let dbObj=dbObjects[i];
			if(dbObj instanceof DBOBJECT)
			{
				dbObj.connectObjects(dbObjects.slice(i));
			}
		}
	}
	DBOBJECT.classesMap=new Map();
	SMOD("DBObj",DBOBJECT);
	
	let DBFRIEND=DB.Firendship=µ.Class(
	{
		[µ.Class.symbols.abstract]:function(DBobj,relationName)
		{
			let objClass=DBobj.constructor,
				rel=DBobj.relations[relationName],
				friendClass=rel.relatedClass.prototype.constructor,
				friendInst=new friendClass(),
				objFieldname=DBobj.objectType+"_ID",
				friendFieldname=friendClass.prototype.objectType+"_ID",
				type=[DBobj.objectType,relationName,friendInst.objectType,rel.targetRelationName].sort().join("_");

			if (objClass===friendClass)
			{
				friendFieldname+=2;
			}

			return {
				objectType:type,
				constructor:function(objId,friendId)
				{
					this.fields={};
					this.fields[objFieldname]=new FIELD(FIELD.TYPES.INT,objId);
					this.fields[friendFieldname]=new FIELD(FIELD.TYPES.INT,friendId);
				},
				objClass:objClass,
				objFieldname:objFieldname,
				friendClass:friendClass,
				friendFieldname:friendFieldname
			}
		},
		toJSON:DBOBJECT.prototype.toJSON,
		fromJSON:DBOBJECT.prototype.fromJSON
	});
	SMOD("DBFriend",DBFRIEND);

	//TODO integrate into DBObject
	REL=DB.Relation=µ.Class(
	{
		constructor:function(relatedClass,type,targetRelationName,fieldName)
		{
			if(fieldName==null)
			{
				if(type==REL.TYPES.PARENT)
					throw "DB.Relation: parent relation needs a fieldName";
				else
					fieldName="ID";
			}
			if(type==null) throw "no relation type";
			this.type=type;
			this.relatedClass=relatedClass; //TODO change to array of classes to support inheritance
			this.fieldName=fieldName;
			if(targetRelationName==null&&(type==REL.TYPES.CHILD||type==REL.TYPES.FRIEND)) throw "DB.Relation: relations other than parent need a targetRelationName";
			this.targetRelationName=targetRelationName;
		}
	});
	REL.TYPES={
		"PARENT"	:-1,
		"FRIEND"	:0,
		"CHILD"		:1
	};
	SMOD("DBRel",REL);
	
	FIELD=DB.Field=µ.Class(
	{
		constructor:function(type,value,options)
		{
			this.type=type;
			this.value=value;
			this.options=options||{};	// depends on connector
		},
		setValue:function(val)
		{
			this.value=val;
		},
		getValue:function()
		{
			if(this.value===undefined) return null;
			return this.value;
		},
		toJSON:function()
		{
			switch(this.type)
			{
				case FIELD.TYPES.DATE:
					let date=this.getValue();
					if(date instanceof Date)
						return date.getUTCFullYear()+","+date.getUTCMonth()+","+date.getUTCDate()+","+date.getUTCHours()+","+date.getUTCMinutes()+","+date.getUTCSeconds()+","+date.getUTCMilliseconds();
					break;
				default:
					return this.getValue();
			}
		},
		fromJSON:function(jsonObj)
		{
			switch(this.type)
			{
				case FIELD.TYPES.DATE:
					this.value=new Date(Date.UTC.apply(Date,jsonObj.split(",")));
					break;
				//TODO other conversions e.g. number from string
				default:
					this.value=jsonObj;
			}
		},
		toString:function()
		{
			return JSON.stringify(this);
		},
		fromString:function(val)
		{
			switch(this.type)
			{
				case FIELD.TYPES.BOOL:
					this.value=!!(~~val);
					break;
				case FIELD.TYPES.INT:
					this.value=~~val;
					break;
				case FIELD.TYPES.DOUBLE:
					this.value=1*val;
					break;
				case FIELD.TYPES.DATE:
				case FIELD.TYPES.STRING:
				    this.value=val;
				    break;
				case FIELD.TYPES.JSON:
				default:
					this.fromJSON(JSON.parse(val));
					break;
			}
		}
	});
	FIELD.TYPES={
		"BOOL"		:0,
		"INT"		:1,
		"DOUBLE"	:2,
		"STRING"	:3,
		"DATE"		:4,
		"JSON"		:5,
		"BLOB"		:6
	};
	SMOD("DBField",FIELD);

	let REFERENCEFIELD=DB.Field.Reference=µ.Class(FIELD,{
		constructor:function(dbObj,relationName)
		{
			this.mega(FIELD.TYPES.INT);
			this.dbObj=dbObj;
			this.relationName=relationName;
		},
		getValue:function()
		{
			let parent=this.dbObj.parents[this.relationName];
			if(parent) return parent.ID;
			return this.mega();
		}
	})
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let DBC=GMOD("DBConn");
	
	SC=SC({
		prom:"Promise",
		eq:"equals",
		
		DBObj:"DBObj",
		DBFriend:"DBFriend"
	});
	
	let ICON=DBC.IndexedDBConnector=µ.Class(DBC,{
		constructor:function(dbName)
		{
			this.mega();
			this.name=dbName;

			SC.prom.pledgeAll(this,["_open","drop"]);
		},
		
		save:function(signal,objs)
		{
			objs=[].concat(objs);
			let sortedObjs=ICON.sortObjs(objs);
			let classNames=Object.keys(sortedObjs);
			this._open(classNames).then(function(db)
			{
				let transactions=Object.entries(sortedObjs).map(SC.prom.pledge(function(tSignal,[objectType,objects])
				{
					let trans=db.transaction(objectType,"readwrite");
					trans.onerror=function(event)
					{
						µ.logger.error(event);
						db.close();
						tSignal.resolve(event);
					};
					trans.oncomplete=function(event)
					{
						µ.logger.info(event);
						db.close();
						tSignal.resolve();
					};
					
					let store = trans.objectStore(objectType);
					for (let object of objects)
					{
						let obj=object.toJSON(), method="put";
						if(obj.ID===undefined)
						{
							delete obj.ID;
							method="add";
						}
						let req=store[method](obj);
						req.onerror=µ.logger.error;
						req.onsuccess=function(event)
						{
							µ.logger.debug(event);
							if (object instanceof SC.DBObj) object.ID=req.result;
						}
					};
				}));
				signal.resolve(new SC.prom(transactions));
			},signal.reject);
		},
		load:function(signal,objClass,pattern)
		{
			this._open().then(function(db)
			{
				if(!db.objectStoreNames.contains(objClass.prototype.objectType))
				{
					db.close();
					signal.resolve([]);
				}
				else
				{
					let trans=db.transaction(objClass.prototype.objectType,"readonly"),
					rtn=[];
					trans.onerror=function(event)
					{
						µ.logger.error(event);
						db.close();
						signal.reject(event);
					};
					trans.oncomplete=function()
					{
						db.close();
						signal.resolve(rtn);
					};

					let store = trans.objectStore(objClass.prototype.objectType);
					if(typeof pattern.ID==="number"|| (Array.isArray(pattern.ID) && pattern.ID.length>0))
					{
						let reqs=[].concat(pattern.ID).map(function(ID)
						{
							let req=store.get(ID);
							req.onerror=function(event)
							{
								µ.logger.error(event);
							};
							req.onsuccess=function(event)
							{
								µ.logger.debug(event);
								if(SC.eq(req.result,pattern))
								{
									let inst=new objClass();
									inst.fromJSON(req.result);
									rtn.push(inst);
								}
							}
						});
					}
					else
					{
						let req=store.openCursor();
						req.onerror=function(event)
						{
							µ.logger.error(event);
							db.close();
							signal.reject(event);
						};
						req.onsuccess=function(event)
						{
							if(req.result)
							{
								if(SC.eq(req.result.value,pattern))
								{
									let inst=new objClass();
									inst.fromJSON(req.result.value);
									rtn.push(inst);
								}
								req.result["continue"]();
							}
						}
					}
				}
			},signal.reject);
		},
		"delete":function(signal,objClass,toDelete)
		{
			let _self=this,
			objectType=objClass.prototype.objectType,
			collectingIDs=null;
			if(typeof toDelete==="number"||toDelete instanceof SC.DBObj||toDelete instanceof SC.DBFriend||Array.isArray(toDelete))
			{
				let ids=DBC.getDeletePattern(objClass,toDelete).ID;
				collectingIDs=SC.prom.resolve(ids);
			}
			else
			{
				collectingIDs=this._open().then(function(db){return new Promise(function(rs,rj)
				{
					let _collectingSelf=this,
					ids=[],
					trans=db.transaction(objectType,"readonly");
					trans.onerror=function(event)
					{
						µ.logger.error(event);
						db.close();
						rj(event);
					};
					trans.oncomplete=function()
					{
						db.close();
						rs(ids);
					};

					let store = trans.objectStore(objectType);
					let req=store.openCursor();
					req.onerror=function(event)
					{
						µ.logger.error(event);
						db.close();
						rj(event);
					};
					req.onsuccess=function(event)
					{
						if(req.result)
						{
							if(SC.eq(req.result.value,toDelete))
							{
								ids.push(req.result.key);
							}
							req.result["continue"]();
						}
					}
					
				})});
			}
			collectingIDs.then(function(ids)
			{
				if(ids.length>0)
				{
					return _self._open().then(function(db)
					{
						let trans=db.transaction(objClass.prototype.objectType,"readwrite");
						trans.onerror=function(event)
						{
							µ.logger.error(event);
							db.close();
							signal.reject(event);
						};
						let store = trans.objectStore(objectType);
						
						let reqs=ids.map(SC.prom.pledge(function(rSignal,ID)
						{
							let req=store["delete"](ID);
							req.onerror=function(event)
							{
								µ.logger.error(event);
								rSignal.resolve(ID);
							};
							req.onsuccess=function(event)
							{
								µ.logger.debug(event);
								rSignal.resolve();
							}
						}));
						return new SC.prom(reqs).then(function()
						{
							db.close();
							//TODO replace with Array.slice
							signal.resolve(Array.from(arguments));
						},µ.logger.error);
					});
				}
				else
				{
					signal.resolve(false);
				}
			},function(event){
				db.close();
				signal.reject(event);
			});
		},
		destroy:function()
		{
			//TODO destructor
			this.mega();
		},
		_open:function(signal,classNames)
		{
			let _self=this;
			let req=indexedDB.open(this.name);
			req.onerror=function(event){
				signal.reject(event);
			};
			req.onsuccess=function()
			{
				let toCreate=[],
				db=req.result,
				version=req.result.version;
				for(let i=0;classNames&&i<classNames.length;i++)
				{
					if(!db.objectStoreNames.contains(classNames[i]))
					{
						toCreate.push(classNames[i]);
					}
				}
				if(toCreate.length===0)
				{
					signal.resolve(db);
				}
				else
				{
					let req2=indexedDB.open(_self.name,version+1);
					req2.onerror=function(event){
						signal.reject(event);
					};
					req2.onupgradeneeded=function()
					{
						for(let i=0;i<toCreate.length;i++)
						{
							req2.result.createObjectStore(toCreate[i],{keyPath:"ID",autoIncrement:true});
						}
					};
					req2.onsuccess=function()
					{
						_self.version=req2.result.version;
						signal.resolve(req2.result);
					};
					db.close();
				}
			}
		},
		/**
		 * requests to drop the whole database
		 */
		drop:function(signal)
		{
			let req=indexedDB.deleteDatabase(this.name)
			req.onsuccess=signal.resolve;
			rec.onerror=signal.reject;
		}
	});
	ICON.isAvailable=function()
	{
		try
		{
			indexedDB.open("availability test");
			return true;
		}
		catch (e)
		{
			return false;
		}
	};
	ICON.sortObjs=function(objs)
	{
		var rtn={};
		for(var i=0;i<objs.length;i++)
		{
			var obj=objs[i],
			objType=obj.objectType;

			if(rtn[objType]===undefined)
			{
				rtn[objType]=[];
			}
			rtn[objType].push(obj);
		}
		return rtn;
	};
	SMOD("IndexedDBConnector",ICON);
	SMOD("IDBConn",ICON);
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){
	
	µ.util=µ.util||{};

	SC=SC({
		Promise:"Promise"
	});
	
	let doRequest=function(signal,param)
	{
		if(param.urls.length==0) signal.reject(new µ.Warning("no Url"));
		else
		{
			let url=param.urls.shift();
			let req=new XMLHttpRequest();
			req.open(param.method,url,true,param.user,param.password);
			req.responseType=param.responseType;
			req.onload=function()
			{
				if (req.status == 200)
				{
					signal.resolve(req.response);
				}
				else
				{
					if(param.urls.length==0) signal.reject({status:req.status,response:req.response,url:url,xhr:req});
					else doRequest(signal,param);
				}
			};
			req.onerror=function(error)
			{
				if(param.urls.length==0) signal.reject({url:url,xhr:req,error:error,response:error.message});
				else doRequest(signal,param);
			};
			if(param.progress)
			{
				req.onprogress=param.progress;
			}
			signal.addAbort(function(){
				param.urls.length=0;
				req.abort();
			});
			req.send(param.data);
		}
	};
	let parseParam=function(param)
	{

		let urls;
		if(typeof param ==="string")
		{
			urls=[param];
		}
		else if (Array.isArray(param))
		{
			urls=param.slice();
		}
		else
		{
			urls=param.urls||[].concat(param.url);
		}
		
		param={
			method:param.method||(param.data?"POST":"GET"),
			user:param.user,//||undefined
			password:param.password,//||undefined
			responseType:param.responseType||"",
			withCredentials:param.withCredentials===true,
			contentType:param.contentType,//||undefined
			data:param.data,//||undefined
			urls:urls
		};
		return param;
	};
	/**
	 * 
	 * @param {string|string[]|requestParam} param
	 * @param {any} scope
	 * @returns {Morgas.Promise}
	 */
	let REQ=µ.util.request=function Request_init(param,scope)
	{
		param=parseParam(param);
		return new SC.Promise(doRequest,{args:param,scope:scope});
	};
	SMOD("request",REQ);

	/**
	 * use: Request(...).catch(Request.allowedStatuses([201,204])).then(...)
	 *
	 */
	REQ.allowedStatuses=function(statuses=[])
	{
		return function(error)
		{
			if(statuses.includes(error.status))
			{
				return error.response;
			}
			return Promise.reject(error);
		};
	};

	REQ.json=function Request_Json(param,scope)
	{

		param=parseParam(param);
		param.responseType="json";
		return REQ(param,scope);
	};
	SMOD("request.json",REQ.json);
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

    var util=µ.util=µ.util||{};

	//SC=SC({});

    var queryRegExp=/[\?&]([^=&]+)(=(([^&]|\\&)*))?/g;
    util.queryParam={};

    (function parseQueryParam(queryString){
        var matches;
        while(matches=queryRegExp.exec(queryString))
        {
            util.queryParam[matches[1]]=matches[3];
        }
    })(decodeURI(window.location.search));

    SMOD("queryParam",util.queryParam);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uObj=util.object=util.object||{};

	//SC=SC({});

	/**
	 *
	 * @param {Number} (stageCount=1) - count of generated stages
	 * @param {Function} (lastType=Object())
	 */
	let register=uObj.register=function(stageCount,lastType=Object)
	{
		stageCount=stageCount>1?stageCount:1;
		let createProxy=function(stageCount)
		{
			return new Proxy({},{
				get:function(storage,key,receiver)
				{
					if(key==="toJSON") return undefined; // called by JSON.stringify
					if(!(key in storage))
					{
						if (stageCount<=1)
						{
							storage[key]=new lastType();
						}
						else
						{
							storage[key]=createProxy(stageCount-1);
						}
					}
					return storage[key];
				},
				set:µ.constantFunctions.f
			});
		};
		return createProxy(stageCount);
	};

	SMOD("register",register);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let obj=util.object=util.object||{};
	
	SC=SC({
		goPath:"goPath"
	});

	let getPath=function(input)
	{
		let path="";
		if(input.dataset.path)
		{
			path=input.dataset.path;
			if(!input.name.startsWith("["))
			{
				path+=".";
			}
		}
		path+=input.name;
		return path;
	}
	
	/**
	 * set input values from object
	 * path in object is defined by data-path attribute
	 * key in object is defined by data-field attribute
	 * @param inputs[] input Nodes
	 * @param {object} source
	 */
	obj.setInputValues=function(inputs,source)
	{
		for(let input of inputs)
		{
			let path=getPath(input);
			let value=SC.goPath(source, path);
			if(value!==undefined)
			{
				if(input.type==="checkbox")
				{
					input.checked=!!value;
				}
				if(input.tagName==="SELECT"&&input.multiple&&Array.isArray(value))
				{
					for(let option of input.options)
					{
						option.selected=value.includes(option.value)
					}
				}
				else
				{
					input.value=value;
				}
			}
		}
	};

	/**
	 * collect input values into object
	 * path in object is defined by data-path attribute
	 * key in object is defined by data-field attribute
	 * @param inputs[] input Nodes
	 * @param {object} target
	 */
	obj.getInputValues=function(inputs,target,create)
	{
		if(!target)
		{
			target={};
			create=true;
		}
		for(let input of inputs)
		{
			let t=target;
			if(input.dataset.path)
			{
				t=SC.goPath(t, input.dataset.path,create,(create?{}:undefined));
			}
			if(t&&(input.name in t||create))
			{
				let value;
				if(input.type==="checkbox")
				{
					value=input.checked;
				}
				else if(input.tagName==="SELECT"&&input.multiple)
				{
					value=[];
					for(let option of input.selectedOptions)
					{
						value.push(option.value);
					}
				}
				else
				{
					value=input.valueAsDate||input.valueAsNumber||input.value;
				}
				t[input.name]=value;
			}
		}
		return target;
	};
	
	SMOD("setInputValues",obj.setInputValues);
	SMOD("getInputValues",obj.getInputValues);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let obj=util.object=util.object||{};

	//SC=SC({});

	/**
	 * adopt attributes defined in [target] from [provider].
	 * when [extend] is set to true all attributes from [provider] are adopted
	 * @param {Object} target
	 * @param {Object|Object[]} [provider=undefined]
	 * @param {Boolean} [extend=false]
	 */
	obj.adopt=function(target,provider,extend)
	{
		if(provider)
		{
			let keys=Object.keys(extend ? provider : target);
			for(let key of keys)
			{
				if(extend||key in provider)
				{
					target[key]=provider[key];
				}
			}
		}
		return target;
	};
	/**
	 * creates a new object so that parameters are left unchanged
	 *
	 * @param {object} target
	 * @param {object} [provider=undefined]
	 * @param {boolean} [extend=false]
	 */
	obj.adopt.setDefaults=function(defaults,param,extend)
	{
		return obj.adopt(obj.adopt({},defaults,true),param,extend);
	};
	SMOD("adopt",obj.adopt);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uMap=util.map=util.map||{};

	//SC=SC({});

	let mapGetCall=Map.prototype.get.call.bind(Map.prototype.get);

	/**
	 *
	 * @param {Number} (stageCount=1) - count of generated stages
	 * @param {Function} (lastType=WeakMap())
	 * @param {Function} (mapType=WeakMap())
	 */
	let register=uMap.register=function(stageCount,lastType=WeakMap,mapType=WeakMap)
	{
		stageCount=stageCount>1?stageCount:1;
		let createMap=function(stageCount)
		{
			let map=new mapType();
			map.set=µ.constantFunctions.f;
			map.get=function(key)
			{
				if(!this.has(key))
				{
					let value;
					if (stageCount<=1)
					{
						value=new lastType();
					}
					else
					{
						value=createMap(stageCount-1);
					}
					mapType.prototype.set.call(this,key,value);
				}
				return mapType.prototype.get.call(this,key);
			};
			return map;
		};
		return createMap(stageCount);
	};

	SMOD("mapRegister",register);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	
	//SC=SC({});

	/**
	 * @typedef {object} fuzzySearchResult
	 * @property {String} data
	 * @property {Number} index - former index in array
	 * @property {Number[]} score
	 */
	/**
	 *
	 * @param {String} search
	 * @param {String[]} data
	 * @returns {fuzzySearchResult[]}
	 */
	let FUZZ=util.fuzzySearch=function fuzzySearch(term,data,{
		threshold=0.1,
		scorers
	}={})
	{
		if(!scorers) scorers=[FUZZ.scoreFunctions.misc.query(term)];
		else scorers=[].concat(scorers);

		let rtn=[];
		for(let index=0;index<data.length;index++)
		{
			let entry=data[index];
			let score=FUZZ.score(entry,scorers);
			if(score<threshold) continue;

			rtn.push({
				data:entry,
				index:index,
				score:score
			});

		}
		rtn.sort(FUZZ.sortResults);
		return rtn;
	};
	FUZZ.scoreFunctions={
		string:{
			complete:function(term)
			{
				let regex=new RegExp(term,"igm");
				return function(data)
				{
					let matches=data.match(regex);
					if (!matches) return 0;
					return matches.length*term.length/data.length;
				};
			},
			wordOrder:function(words)
			{
				words=words.map(s=>s.toLowerCase());
				let regex=new RegExp(words.join("|"),"ig");
				return function(data)
				{
					let wordIndex=words.length-1;
					let count=0;
					let found=null;
					regex.lastIndex=0;
					while(count<words.length&&(found=regex.exec(data)))
					{
						let foundIndex=words.indexOf(found[0].toLowerCase());
						if(foundIndex==(wordIndex+1)%words.length)
						{
							count++;
						}
						wordIndex=foundIndex;
					}
					return count/words.length;
				};
			},
			words:function(words)
			{
				words=words.map(s=>s.toLowerCase());
				let regex=new RegExp(words.join("|"),"ig");
				return function(data)
				{
					regex.lastIndex=0;
					let toFind=words.slice();
					let found=null;
					while(toFind.length>0&&(found=regex.exec(data)))
					{
						let foundIndex=toFind.indexOf(found[0].toLowerCase());
						if (foundIndex!=-1) toFind.splice(foundIndex,1);
					}
					return 1-toFind.length/words.length;
				};
			},
		},
		object:{
			property:function(key,scorers)
			{
				return function(data)
				{
					if(data&&key in data) return FUZZ.score(data[key],scorers);
					return 0;
				}
			}
		},
		misc:{
			query:function(term)
			{
				term=term.trim();
				let words=term.split(/\s+/);
				let scorers=[
					FUZZ.scoreFunctions.string.complete(term),
					FUZZ.scoreFunctions.string.wordOrder(words),
					FUZZ.scoreFunctions.string.words(words)
				];

				let camelCaseWords=term.match(/(:?\b[a-z]|[A-Z])[a-z]*/g);
				if(camelCaseWords)
				{
					scorers.push(FUZZ.scoreFunctions.string.wordOrder(camelCaseWords));
					scorers.push(FUZZ.scoreFunctions.string.words(camelCaseWords));
				}
				return function(data)
				{
					return FUZZ.score(data,scorers);
				};
			},
			cache:function(scorers)
			{
				let cache=new WeakMap();
				return function(data)
				{
					if(!cache.has(data)) cache.set(data,FUZZ.score(data,scorers));
					return cache.get(data);
				};
			}
		}
	};
	FUZZ.score=function(data,scorers)
	{
		// shortcut for arrays with only 1 entry
		if(scorers.length==1) return scorers[0](data);

		let score=0;
		let totalWeight=0;
		for(let scorer of scorers)
		{
			let fn,weight;
			if(typeof scorer=="function")
			{
				fn=scorer;
				weight=1;
			}
			else
			{
				fn=scorer.fn;
				weight=scorer.weight||1;
			}
			score+=fn(data)*weight;
			totalWeight+=weight;
		}
		return score/totalWeight;
	};
	FUZZ.sortResults=function({score:score1},{score:score2})
	{
		return FUZZ.sortScore(score1,score2);
	};
	FUZZ.sortScore=function(score1,score2)
	{
		return score2-score1;
	};

	SMOD("fuzzySearch",FUZZ);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){
	
	var util=µ.util=µ.util||{};

	//SC=SC({});

	util.download=function(data,name,mediaType)
	{
		if(data instanceof Blob)
		{
			data=URL.createObjectURL(data)
		}
		name=name||"file";
		mediaType=mediaType||"";
		
		util.download.el.download=name;
		if(data.startsWith("data:")||data.startsWith("blob:"))
		{
			util.download.el.href=data;
		}
		else
		{
			util.download.el.href="data:"+mediaType+";base64,"+btoa(unescape(encodeURIComponent(data)));
		}
		document.body.appendChild(util.download.el);
		util.download.el.click();
		util.download.el.remove();
	};
	util.download.el=document.createElement("a");
	SMOD("download",util.download);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){
	
	let util=µ.util=µ.util||{};

	//SC=SC({});

	let table=new Map();
	let getPolynomial=function(n)
	{
	   if(!table.hasOwnProperty(n))
	   {
		   let c=n;
		   for(let k=0;k<8;k++)
		   {
			   c=((c&1)?(0xEDB88320^(c>>>1)):(c>>>1));
		   }
		   return table[n]=c;
	   }
	   return table[n];
	};

	let CRC32=util.crc32=function(data,crcPart)
	{
		let isString=typeof data==="string";
		let crc=crcPart!=null ? ((crcPart^-1)<<0) : 0^(-1);
		for (let i=0,l=data.length;i<l;i++)
		{
			let b=isString ? data.charCodeAt(i) : data[i];
			crc=(crc>>>8)^getPolynomial((crc^b)&0xFF);
		}
		return (crc^(-1))>>>0;
	};
	CRC32.format=function(crc)
	{
		return "00000000"+crc.toString(16).toUpperCase().slice(-8);
	};

	CRC32.Builder=function(crcPart)
	{
		this.crcPart=crcPart!=null ? crcPart : 0;
	};
	CRC32.Builder.prototype.add=function(data)
	{
		this.crcPart=CRC32(data,this.crcPart);
		return this;
	};
	CRC32.Builder.prototype.get=function(){return this.crcPart;};
	CRC32.Builder.prototype.getFormatted=function()
	{
		return CRC32.format(this.crcPart);
	};

	SMOD("util.crc32",CRC32);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
    let uCon=util.converter=util.converter||{};

	//SC=SC({});

	let stages=["y","z","a","f","p","n","µ","m","","K","M","G","T","P","E","Z","Y"];

	let getRegex=function(base)
	{
		return new RegExp("([\\d.]+)\\s*(["+stages.join("")+"]?)"+base);
	};

	uCon.metricUnit={

		to:function(value,{
			base="",
			decimalPlaces=2,
			currentStage="",
			factor=1000
		}={})
		{
			if(value==0) return value.toFixed(decimalPlaces)+base;
			let index=stages.indexOf(currentStage);
			if(index==-1) return value.toFixed(decimalPlaces)+currentStage+base;
			while(value>factor&&index<stages.length)
			{
				value/=factor;
				index++;
			}
			while(value<1&&index>1)
			{
				value*=factor;
				index--;
			}
			return value.toFixed(decimalPlaces)+stages[index]+base;
		},
		from:function(string,{
			base="",
			toStage="",
			factor=1000,
		}={})
		{
			let match=string.match(getRegex(base));
			if(match)
			{
				let value=parseFloat(match[1]);
				if(Number.isNaN(value)) return NaN;
				let modifier=match[2];
				let index=stages.indexOf(modifier);
				if(index==-1) return NaN;
				let toIndex=stages.indexOf(toStage);
				if(toIndex==-1) return NaN;
				return value*(factor**(index-toIndex));
			}
			return NaN;
		}
	};

	SMOD("metricUnit",uCon.metricUnit);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

    let util=µ.util=µ.util||{};
    let uCon=util.converter=util.converter||{};

	//SC=SC({});

	uCon.csv={
		symbols:{
			line:Symbol("csv.line"),
			overflowCells:Symbol("csv.overflowCells")
		},
		to:function(){
			//TODO
			throw "todo";
		},
		defaultSeperator:",",
		from:function(csvData,columnNames,seperator)
		{
			csvData+="";
			
			seperator=seperator||uCon.csv.defaultSeperator;
			let cellEXP=new RegExp('(?:"((?:[^"]|"")*)"|([^"\r\n'+seperator+']*))'+seperator+'?','g'), cleanUpEXP=/"(")/g;

			let rtn={
				data:[],
				columns:columnNames||[]
			};
			
			let item={
				[uCon.csv.symbols.line]:"",
				[uCon.csv.symbols.overflowCells]:[]
			};
			let cellIndex=0,isFirstLine=!columnNames,match=null;
			while((match=cellEXP.exec(csvData))!==null)
			{
				if(match[0]==="")
				{//line end
					while(csvData[cellEXP.lastIndex]==="\r"||csvData[cellEXP.lastIndex]==="\n") cellEXP.lastIndex++;
					if(isFirstLine) isFirstLine=false;
					else
					{
						for(;cellIndex<rtn.columns.length;cellIndex++)item[rtn.columns[cellIndex]]=null;
						rtn.data.push(item);
						//item for next line
						item={
							[uCon.csv.symbols.line]:"",
							[uCon.csv.symbols.overflowCells]:[]
						}
						cellIndex=0;
					}
					if(cellEXP.lastIndex>=csvData.length) break;
				}
				else
				{//next cell
					let value=null;
					if(match[1]) value=match[1].replace(cleanUpEXP,"$1");
					else value=match[2];
					if(isFirstLine)
					{
						rtn.columns.push(value);
					}
					else
					{
						item[uCon.csv.symbols.line]+=match[0];
						if(cellIndex<rtn.columns.length)
						{
							item[rtn.columns[cellIndex]]=value;
						}
						else item[uCon.csv.symbols.overflowCells].push(value);

						cellIndex++;
					}
				}
			}
			return rtn;
		}
	};
    SMOD("CSV",uCon.csv);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	var util=µ.util=µ.util||{};
	var utilArray=util.array=util.array||{};

	//SC=SC({});

	/**
	 * Compares each value of the arrays for equality ( like a[n]===b[n] , where n>=0 && n<=length)
	 * Arrays of different length are not equal
	 *
	 * @param {Any[]} a
	 * @param {Any[]} b
	 */
	utilArray.equal=function(a,b)
	{
		if(!a!=!b) return false;
		if(!a) return true; // both null
		if(a.length!=b.length) return false;
		for (let i=0;i<a.length;i++)
		{
			if(a[i]!==b[i]) return false;
		}
		return true;
	};
	SMOD("array.equal",utilArray.equal);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	//SC=SC({});

	µ.signature=
`
          _       .-.
 _   _   (_)___   \\  |.-.
| | | |  | / __|   \\_|_/
| |_| |_ | \\__ \\   \`
| ._,_(_)/ |___/ Contribute or Complain at
|_|    |__/ https://github.com/Morgas01/Morgas.js
`;

	SMOD("signature",µ.signature);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){
	
	//SC=SC({});

	/**
	 * Holds values and sorted arrays of their indexes.
	 * If values are already indexes use library.
	 *
	 * @param {any} (values=null) - values or indexes of library
	 * @param {Object} (library=null} - map of index to real values
	 */
	let SA=µ.SortedArray=µ.Class({
		constructor:function(values,library)
		{
			this.sorts=new Map();
			this.values=[];
			this.values.freeIndexes=[];
			this.library=library;

			if(values)this.addAll(values);
		},
		add:function(value)
		{
			let index=this.values.freeIndexes.shift();
			if(index===undefined)index=this.values.length;
			this.values[index]=value;
			for (let sort of this.sorts.values())
			{
				this._addToSort(sort,value,index);
			};
			return index;
		},
		addAll(values)
		{
			let indexes=[];
			for(let value of values) indexes.push(this.add(value));
			return indexes;
		},
		hasSort:function(sortName){return this.sorts.has(sortName)},
		sort:function(sortName,sortFn)
		{
			let sort=this.sorts.get(sortName);
			if(sort)
			{
				sort.indexes.length=0;
				sort.fn=sortFn;
			}
			else
			{
				sort={indexes:[],fn:sortFn};
			}
			this.sorts.set(sortName,sort);
			this.values.forEach((item,index)=>this._addToSort(sort,item,index));
			return this;
		},
		_addToSort:function(sort,value,index)
		{
			let orderIndex;
			let source=this.values;
			if(this.library)
			{
				index=value;
				value=this.library[value];
				source=this.library;
			}
			orderIndex=SA.getOrderIndex(value,source,sort.fn,sort.indexes);
			sort.indexes.splice(orderIndex,0,index);
		},
		remove:function(values)
		{
			if(values==null) return null;
			let indexes=[];
			for (let item of values)
			{
				let valueIndex=this.values.indexOf(item);
				if (valueIndex!==-1)
				{
					let index=(this.library ? item : valueIndex);
					if(index!=null)
					{
						for(let sort of this.sorts.values())
						{
							let orderIndex=sort.indexes.indexOf(index);
							if (orderIndex!==-1) sort.indexes.splice(orderIndex,1);
						}
						if(valueIndex===this.values.length-1)this.values.length--;
						else
						{
							delete this.values[valueIndex];
							this.values.freeIndexes.push(valueIndex);
						}
						indexes.push(index);
					}
				}
			}
			return indexes;
		},
		update:function(values)
		{
			if(!values)
			{//all
				values=this.values.slice();
				this.clear();
				return this.add(values);
			}

			let indexes=[];
			for(let value of values)
			{
				let index=this.values.indexOf(value);
				if(index!==-1) indexes.push(index);
			}
			for(let sort of this.sorts.values())
			{
				for(let index of indexes)
				{
					if(this.library)index=this.values[index];
					let orderIndex=sort.indexes.indexOf(index);
					if(orderIndex!==-1)
					{
						sort.indexes.splice(orderIndex,1);
					}
				}
				for(let index of indexes)
				{
					this._addToSort(sort,this.values[index],index);
				}
			}
			return indexes;

		},
		getIndexes:function(sortName)
		{
			if (!this.sorts.has(sortName))return null;
			else return this.sorts.get(sortName).indexes.slice();
		},
		get:function(sortName)
		{
			let sort=this.sorts.get(sortName)
			if (!sort)return null;
			else if (this.library) return sort.indexes.map(i=>this.library[i]);
			else return sort.indexes.map(i=>this.values[i]);
		},
		/**
		 * returns an Array of values without empty entries.
		 * uses libary if there is one
		 * @returns {any[]}
		 */
		getValues:function()
		{
			let rtn=[];
			for(let index in this.values)
			{
				if(index!=="freeIndexes")
				{
					if(this.library) rtn.push(this.library[this.values[index]]);
					else rtn.push(this.values[index]);
				}
			}
			return rtn;
		},
		/**
		 * returns value for the library index.
		 * returns undefined if no library is defined.
		 * @param {number} libaryIndex
		 * @returns {any}
		 */
		getValue:function(libaryIndex)
		{
			if(this.library)return this.library[libaryIndex];
			return undefined;
		},
		clear:function()
		{
			this.values.length=this.values.freeIndexes.length=0;
			for(let sort of this.sorts.values()) sort.indexes.length=0;
			return this;
		},
		destroy:function()
		{
			this.values.length=this.values.freeIndexes.length=0;
			this.sorts.clear();
			this.mega();
		}
	});

	
	/**
	 * @summary Get index of the {item} in the {source} or {order} defined by {sort}
	 * @description Finds the index of {item} in {source}.
	 * The order is defined by the sort function (like Array.sort()).
	 * If {Source} is not sorted, you must supply {order} as an Array of indexes in the right order.
	 *
	 *
	 * @param {any} item - item to find the index of
	 * @param {any[]} source - original array. must be sorted if order is not supplied!
	 * @param {function} sort	(item, source item ) returns 1,0,-1 whether item is higher,equal,lower than source item
	 * @param {number[]} (order) - Array of sorted indexes of source. Defaults to an array with 0..source.length-1
	 *
	 * @returns	{number}
	 */
	SA.getOrderIndex=function(item,source,sort,order=[...Array(source.length).keys()])
	{
		//start in the middle
		let length=order.length;
		let jump=Math.ceil(length/2);
		let i=jump;
		let lastJump=null;
		while(jump/*!=0||NaN||null*/&&i>0&&i<=length&&!(jump===1&&lastJump===-1))
		{
			lastJump=jump;
			let compare=source[order[i-1]];
			//jump half the size in direction of this sort			(if equals jump 1 to conserv the order)
			jump=Math.ceil(Math.abs(jump)/2)*Math.sign(sort(item,compare)) ||1;
			i+=jump;
			if((i<1||i>length)&&Math.abs(jump)>1)i=Math.max(1,Math.min(length,i));
		}
		i=Math.min(Math.max(i-1,0),length);
		return i
	};
	
	/**
	 * sort simply by using > or < 
	 * @param {boolean} DESC
	 */
	SA.naturalOrder=function(DESC)
	{
		return function(a,b){return (DESC?-1:1)*( (a>b) ? 1 : (a<b) ? -1 : 0)};
	};

	/**
	 * sort the values returned by getter simply by using > or < 
	 * @param {function} getter
	 * @param {boolean} DESC
	 */
	SA.orderBy=function(getter,DESC)
	{
		return function(_a,_b)
		{
			let a=getter(_a),b=getter(_b);
			return (DESC?-1:1)*( (a>b) ? 1 : (a<b) ? -1 : 0);
		};
	};
	
	SMOD("SortedArray",SA);
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uFn=util["function"]=util["function"]||{};

	//SC=SC({});

	/**
	 * proxy methods from source to target.
	 * called methods have scope of its source
	 *
	 * @param {Object|Function|String} source - source object, getter for dynamic source, or key in scope
	 * @param {Iterable<String|String[]>|Object<String,String>} mapping - Iterable with Strings or Array of Strings as [sourcekey,targetKey]. Objects will be converted via Object.entries()
	 * @param {Object} target
	 */
	uFn.proxy=function(source,mapping,target)
	{
		let isKey=false;
		let isGetter=false;
		switch(typeof source)
		{
			case "string":
				isKey=true;
				break;
			case "function":
				isGetter=true;
				break;
		}
		if(!(Symbol.iterator in mapping))
		{
			mapping=Object.entries(mapping);
		}
		for(let entry of mapping)
		{
			let sourcekey;
			let targetKey;

			if(Array.isArray(entry)) ([sourcekey,targetKey]=entry)
			else sourcekey=targetKey=entry;
			if(isKey)
			{
				target[targetKey]=function(){return this[source][sourcekey].apply(this[source],arguments)};
			}
			else if (isGetter)
			{
				target[targetKey]=function(){var scope=source.call(this,sourcekey);return scope[sourcekey].apply(scope,arguments);};
			}
			else
			{
				target[targetKey]=source[sourcekey].bind(source);
			}
		}
	};
	SMOD("proxy",uFn.proxy);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);

/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uObj=util.object=util.object||{};

	//SC=SC({});

	/**
	 * @param {Any} obj
	 * @param {Any} pattern
	 * @Returns {Boolean}
	 *
	 * @summary Matches {obj} against {pattern}.
	 * @description
	 *	check order:
	 *
	 * 1. match strictly (===) and check NaN
	 * 2 of pattern is null (or undefined): false
	 * 3. if Pattern is a RegExp: pattern.test(obj)
	 * 3.1 if object is instance of RegExp match string representation
	 * 4. if Pattern is a Function and obj isn't: pattern(obj)
	 * 5. if pattern is an Array: check if it includes obj then check every sub pattern
	 * 6. if obj is null: false
	 * 7. if obj has a .equals Function: obj.equals(pattern)
	 * 8. if pattern is an Object: recurse for every key in pattern
	 *
	 */
	uObj.equals=function(obj,pattern)
	{
		if(obj===pattern||(Number.isNaN(obj)&&Number.isNaN(pattern)))
		{
			return true;
		}
		if(pattern==null) return false;
		if(pattern instanceof RegExp)
		{
			if( typeof obj==="string") return pattern.test(obj);
			else if(obj instanceof RegExp) return obj.toString()==pattern.toString();
			return false;
		}
		if(typeof pattern==="function")
		{
			if(typeof obj==="function") return false;
			else return pattern(obj);
		}
		if(Array.isArray(pattern))
		{
			if(pattern.includes(obj))
			{
				return true;
			}
			return pattern.findIndex(p=>uObj.equals(obj,p))!=-1;
		}
		if(obj==null) return false;
		if(typeof obj.equals==="function")
        {
            return obj.equals(pattern);
        }
		if(typeof pattern==="object")
		{
			for(let i in pattern)
			{
				if(!uObj.equals(obj[i],pattern[i]))
					return false;
			}
			return true;
		}
		return false;
	};
	/**
	 * creates a test for equals to pattern
	 * @param pattern
	 * @returns {Function}
	 */
	uObj.equals.test=function(pattern)
	{
		return function(obj)
		{
			return uObj.equals(obj,pattern);
		}
	};

	// logic
	uObj.equals["Number.NaN"]=()=>Number.NaN;
	uObj.equals["Number.NEGATIVE_INFINITY"]=()=>Number.NEGATIVE_INFINITY;
	uObj.equals["Number.POSITIVE_INFINITY"]=()=>Number.POSITIVE_INFINITY;
	uObj.equals.unset=function()
	{
		let unset=function unset(value)
		{
			return value==null;
		};
		unset.toString=unset.toJSON=()=>"[unset]";
		return unset;
	};
	uObj.equals.not=function(pattern)
	{
		let not=function not(value)
		{
			return !uObj.equals(value,pattern);
		};
		not.toString=not.toJSON=()=>"[not]"+uObj.equals.patternToString(pattern);
		return not;
	};
	uObj.equals.greater=function(pattern)
	{
		let greater=function greater(value)
		{
			return value>pattern;
		};
		greater.toString=greater.toJSON=()=>"[greater]"+uObj.equals.patternToString(pattern);
		return greater;
	};
	uObj.equals.greaterEqual=function(pattern)
	{
		let greaterEqual=function greaterEqual(value)
		{
			return value>=pattern;
		};
		greaterEqual.toString=greaterEqual.toJSON=()=>"[greaterEqual]"+uObj.equals.patternToString(pattern);
		return greaterEqual;
	};
	uObj.equals.less=function(pattern)
	{
		let less=function less(value)
		{
			return value<pattern;
		};
		less.toString=less.toJSON=()=>"[less]"+uObj.equals.patternToString(pattern);
		return less;
	};
	uObj.equals.lessEqual=function(pattern)
	{
		let lessEqual=function lessEqual(value)
		{
			return value<=pattern;
		};
		lessEqual.toString=lessEqual.toJSON=()=>"[lessEqual]"+uObj.equals.patternToString(pattern);
		return lessEqual;
	};
	uObj.equals.between=function(min,max)
	{
		let pattern;
		if(Array.isArray(min))
		{
			pattern=min;
			min=pattern[0];
			max=pattern[1];
		}
		else pattern=[min,max];
		let between=function between(value)
		{
			return min<value&&value<max;
		};
		between.toString=between.toJSON=()=>"[between]"+uObj.equals.patternToString(pattern);
		return between;
	};
	uObj.equals.betweenInclude=function(min,max)
	{
		let pattern;
		if(Array.isArray(min))
		{
			pattern=min;
			min=pattern[0];
			max=pattern[1];
		}
		else pattern=[min,max];
		let betweenInclude=function betweenInclude(value)
		{
			return min<=value&&value<=max;
		};
		betweenInclude.toString=betweenInclude.toJSON=()=>"[betweenInclude]"+uObj.equals.patternToString(pattern);
		return betweenInclude;
	};
	uObj.equals.containsOrdered=function(iterablePattern)
	{
		let length=iterablePattern.size||iterablePattern.length||0;

		let containsOrdered=function containsOrdered(value)
		{
			if(!value||!(Symbol.iterator in value)) return false;
			let valueLength=value.size||value.length||0;
			if(valueLength!=length) return false;
			let iterator=value[Symbol.iterator]();
			for(let pattern of iterablePattern)
			{
				let {done,value:entry}=iterator.next();
				if(done||!uObj.equals(entry,pattern)) return false;
			}
			return true;
		};
		containsOrdered.toString=containsOrdered.toJSON=()=>"[containsOrdered]"+uObj.equals.patternToString(iterablePattern);
		return containsOrdered;
	};

	let patternToJSON=function(pattern)
	{
		if (pattern==null) return pattern;
		else if(Number.isNaN(pattern)) return "[Number.NaN]";
		else if (pattern===Number.NEGATIVE_INFINITY) return "[Number.NEGATIVE_INFINITY]";
		else if (pattern===Number.POSITIVE_INFINITY) return "[Number.POSITIVE_INFINITY]";
		else if (Array.isArray(pattern)) return pattern.map(patternToJSON);
		else
		{
			switch(typeof pattern)
			{
				case "function":
					return pattern.toString();
				case "object":
					let rtn={};
					for(let key in pattern) rtn[key]=patternToJSON(pattern[key]);
					return rtn;
				default:
					return pattern;
			}
		}
	};

	uObj.equals.patternToString=function(pattern)
	{
		return JSON.stringify(patternToJSON(pattern,function(key,value)
		{
			if(value instanceof RegExp) return value.toString();
			if(value instanceof Set) return Array.from(value);
			return value;
		}));
	}
	let parseRegex=/^\[([^\]]+)\](.*)/;
	let patternFromJSON=function(pattern)
	{
		if(typeof pattern==="string")
		{
			let match=pattern.match(parseRegex);
			if(match)
			{
				let fn=match[1],value=match[2];
				if(value!=="")
				{
					value=JSON.parse(value);
					if(parseRegex.test(value)) value=patternFromJSON(value);
				}
				if(fn in uObj.equals) return uObj.equals[fn](value);
				else throw new SyntaxError("unknown equals function: "+fn);
			}
		}
		else if (typeof pattern==="object")
		{
			if(pattern===null) return null;
			else if (Array.isArray(pattern)) return pattern.map(patternFromJSON);
			else
			{
				let rtn={};
				for(let key in pattern) rtn[key]=patternFromJSON(pattern[key]);
				return rtn;
			}
		}
		return pattern;
	};
	uObj.equals.stringToPattern=function(patternString)
	{
		return patternFromJSON(JSON.parse(patternString));
	};

	SMOD("equals",uObj.equals);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uObj=util.object=util.object||{};

	let pathRegEx=/\[[^\]]+\]|\.?[^.\[]+/g;
	let arrayRegEx=/^\[(\d+)\]$|^\]$/;
	let trimRegEx=/^\.|^\["?|"?]$/g;

	//SC=SC({});

	/** goPath
	 * Goes the {path} from {obj} checking all but last step for existance.
	 * 
	 * goPath(obj,"path.to.target") === goPath(obj,["path","to","target"]) === obj.path.to.target
	 * 
	 * when creating is enabled use "foo[].n" or "foo[n]" instead of "foo.2" to create an array
	 * 
	 * @param {Any} obj
	 * @param {String|string[]} path
	 * @param {Boolean} (create=false) create missing structures
	 * @param {Any} (defaultValue) set missing value
	 */
	uObj.goPath=function(obj,path,create,defaultValue)
	{
		if(obj==null) return undefined;
		if(typeof path=="string")path=path.match(pathRegEx);

		for(let index=0; index<path.length;index++)
		{
			if(path[index]==="]") continue;
			let key=path[index].replace(trimRegEx,"");
			if(!(key in obj))
			{
				if(create&&index+1<path.length)
				{
					let value;
					if(arrayRegEx.test(path[index+1])) value=[];
					else value={};

					obj=obj[key]=value;
					continue;
				}
				if(index+1==path.length&&defaultValue!==undefined)
				{
					return obj[key]=defaultValue;
				}
				return undefined;
			}
			obj=obj[key];
		}
		return obj;
	};
	uObj.goPath.guide=function(...args)
	{
		return function(obj){return uObj.goPath(obj,...args)};
	};
	SMOD("goPath",uObj.goPath);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let SortedArray=GMOD("SortedArray");

	SC=SC({
		eq:"equals",
		goPath:"goPath",
		proxy:"proxy"
	});
	 
	let ORG=µ.Organizer=µ.Class(SortedArray,{
		constructor:function(values)
		{

			this.filters=new Map();
			SC.proxy(this.filters,{
				"has":"hasFilter",
			},this);

			this.maps=new Map();
			SC.proxy(this.maps,{
				"has":"hasMap",
				"delete":"removeMap"
			},this);

			this.groups=new Map();
			SC.proxy(this.groups,{
				"has":"hasGroup"
			},this);

			this.mega(values);
			
		},
		getSort:SortedArray.prototype.get,
		getIndexSort:SortedArray.prototype.getIndexes,
		filter:function(filterName,filterFn,createFn)
		{
			switch(typeof filterFn)
			{
				case "string":
					filterFn=SC.goPath.guide(filterFn);
					break;
				case "object":
					filterFn=SC.eq.test(filterFn);
					break;
			}
			let filter=this.filters.get(filterName);
			if(!filter)
			{
				let child=new ORG();
				child.library=this.library||this.values;
				filter={
					child:child,
					fn:filterFn
				};
			}
			else
			{
				filter.fn=filterFn;
				filter.child.clear();
			}
			this.filters.set(filterName,filter);

			if(createFn) createFn(filter.child);

			for(let i=0;i<this.values.length;i++)
			{
				this._filter(filter,this.values[i],i);
			}
			return this;
		},
		_filter:function(filter,value,index)
		{
			if(this.library)
			{
				index=value;
				value=this.library[index];
			}
			if(filter.fn(value)) filter.child.add(index);
		},
		getFilter:function(filterName)
		{
			if(this.hasFilter(filterName))
			{
				return this.filters.get(filterName).child;
			}
			return null;
		},
		removeFilter:function(filterName)
		{
			if(this.hasFilter(filterName))
			{
				this.filters.get(filterName).child.destroy();
				this.filters.delete(filterName);
			}
		},
		map:function(mapName,mapFn)
		{
			if(typeof mapFn==="string") mapFn=SC.goPath.guide(mapFn);
			let map={mapFn:mapFn,values:{}};
			if(this.hasMap(mapName)) this.removeMap(mapName);
			this.maps.set(mapName,map);
			for(let i=0;i<this.values.length;i++)
			{
				this._map(map,this.values[i],i);
			}
			return this;
		},
		_map:function(map,value,index)
		{
			if(this.library){
				index=value;
				value=this.library[index];
			}
			let key=""+map.mapFn(value);
			map.values[key]=index;
		},
		getIndexMap:function(mapName)
		{
			if(this.hasMap(mapName))return Object.assign({},this.maps.get(mapName).values);
			return null;
		},
		getMap:function(mapName)
		{
			if(this.hasMap(mapName))
			{
				let rtn={};
				for(let [key,index] of Object.entries(this.maps.get(mapName).values))
				{
					if(this.library) rtn[key]=this.library[index];
					else rtn[key]=this.values[index];
				}
				return rtn;
			}
			else return null;
		},
		group:function(groupName,groupFn,createFn)
		{
			if(typeof groupFn==="string") groupFn=SC.goPath.guide(groupFn);
			let group={children:{},groupFn:groupFn,createFn:createFn};
			if(this.hasGroup(groupName))this.removeGroup(groupName);
			this.groups.set(groupName,group);
			for(let i=0;i<this.values.length;i++)
			{
				this._group(group,this.values[i],i);
			}
			return this;
		},
		_group:function(group,value,index)
		{
			if(this.library){
				index=value;
				value=this.library[index];
			}
			let gKeys=[].concat(group.groupFn(value));
			for(let gKey of gKeys)
			{
				if(!(gKey in group.children))
				{
					let child=new ORG();
					child.library=this.library||this.values;
					if(group.createFn)group.createFn(child,gKey);
					group.children[gKey]=child;
				}
				group.children[gKey].add(index);
			}
		},
		getGroup:function(groupName)
		{
			if(this.hasGroup(groupName))
			{
				return Object.assign({},this.groups.get(groupName).children);
			}
			else return undefined;
		},
		getGroupPart:function(groupName,partName)
		{
			if(this.hasGroup(groupName))
			{
				return this.groups.get(groupName).children[partName];
			}
			else return undefined;
		},
		getGroupValues:function(groupName)
		{
			if(this.hasGroup(groupName))
			{
				let _g=this.getGroup(groupName);
				let rtn={};
				for(let i in _g)rtn[i]=_g[i].getValues();
				return rtn;
			}
			else return undefined;
		},
		removeGroup:function(groupName)
		{
			if(this.hasGroup(groupName))
			{
				let gs=this.getGroup(groupName);
				for(let g in gs)
				{
					gs[g].destroy();
				}
				this.groups.delete(groupName);
			}
			return this;
		},
		add:function(value)
		{
			let index=this.mega(value);
			this._add(index);
			return index;
		},
		_add:function(index)
		{
			let value=this.values[index];
			for(let filter of this.filters.values()) this._filter(filter,value,index);
			for(let map of this.maps.values()) this._map(map,value,index);
			for(let group of this.groups.values()) this._group(group,value,index);
		},
		remove:function(values)
		{
			let indexes=this.mega(values);
			if(indexes)
			{
				this._remove(indexes);
				return indexes;
			}
			return indexes;
		},
		_remove:function(indexes)
		{
			for(let filter of this.filters.values()) filter.child.remove(indexes);
			for(let map of this.maps.values())
			{
				for(let m in map.values)
				{
					if(indexes.indexOf(map.values[m])!==-1) delete map.values[m];
				}
			}
			for(let group of this.groups.values())
			{
				for(let child of Object.values(group.children))
				{
					child.remove(indexes);
				}
			}
		},
		update:function(values)
		{
			let indexes=this.mega(values);
			if(indexes)
			{
				this._remove(indexes);
				for(let index of indexes) this._add(index);
			}
		},
		clear:function()
		{
			this.mega();
			for(let filter of this.filters.values()) filter.child.clear();
			for(let map of this.maps.values()) map.values={};
			for(let group of this.groups.values())
			{
				for(let child in Object.values(group.children))
				{
					child.clear();
				}
			}
			return this;
		},
		/**
		 * @param {Boolean} (some=false) - collect values that are anywhere included ( false = everywhere )
		 * @param {String} (sort) - name of sort
		 */
		combine:function(some,sort)
		{
			some=!!some;
			let indexes=this.hasSort(sort)?this.getIndexSort(sort):(this.library ? this.values.slice() : this.values.map((a,i)=>i));
			let inside=some?[]:indexes;
			let outside=some?indexes:[];
			let _doCombine=list=>
			{
				let i=inside,o=outside;
				if(some)i=outside,o=inside;

				i.forEach((value,index)=>
				{
					if((list.indexOf(value)!==-1)==some)// in list XOR collecting those in some lists
					{
						o[index]=value;
						delete i[index];
					}
				});
			};
			let rtn={
				getIndexes:outer=>(outer?outside:inside).filter(i=>i!=undefined),
				get:outer=>rtn.getIndexes(outer).map(i=>(this.library?this.library:this.values)[i]),
				filter:name=>
				{
					if(this.hasFilter(name))_doCombine(this.getFilter(name).values);
					return rtn;
				},
				group:(name,part)=>
				{
					part=this.getGroupPart(name,part);
					if(part)_doCombine(part.values);
					return rtn;
				},
				combine:c=>
				{
					if(c._getOrigin()===this||c._getOrigin().library===this.library)
					{
						_doCombine(c.getIndexes());
					}
					return rtn;
				},
				_getOrigin:()=>this
			};
			return rtn;
		},
		destroy:function()
		{
			for (let filter of this.filters.values())
			{
				filter.child.destroy();
			}
			this.filters.clear();
			this.maps.clear();
			for (let group of this.groups.values())
			{
				for(let child of Object.values(group.children))
				{
					child.destroy();
				}
			}
			this.groups.clear();

			this.mega();
		}
	});
	ORG.naturalOrder=SortedArray.naturalOrder;
	ORG.orderBy=SortedArray.orderBy;
	
	/**
	 * sort by multiple attributes
	 * @param {string[]} paths array of paths to attributes for sorting
	 * @param {boolean} (DESC=false)
	 * @return function
	 */
	ORG.attributeSort=function(paths,DESC)
	{
		return function(obj,obj2)
		{
			let rtn=0,a,b;
			for(let i=0;i<paths.length&&rtn===0;i++)
			{
				a=SC.goPath(obj,paths[i]);
				b=SC.goPath(obj2,paths[i]);
				rtn=(DESC?-1:1)*( (a>b) ? 1 : (a<b) ? -1 : 0)
			}
			return rtn;
		}
	};
	
	SMOD("Organizer",ORG);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let DBC=GMOD("DBConn");
	let ORG=GMOD("Organizer");
	
	SC=SC({
		eq:"equals",
	});
	
	let getDb=function()
	{
		return new ORG().group("objectType","objectType",function(tDb)
		{
			tDb.map("ID","fields.ID");
		});
	};
	
	let OCON=DBC.ObjectConnector=µ.Class(DBC,
	{
		constructor:function(global)
		{
			this.mega();
			this.db=getDb();
		},
		save:function(signal,objs)
		{
			objs=[].concat(objs);
			let sortedObjs=DBC.sortObjs(objs);
			
			for(let objectType in sortedObjs.fresh)
			{
				let objs=sortedObjs.fresh[objectType],
				ids=this._getNextID(objectType);
				for(let i=0;i<objs.length;i++)
				{
					let id=(i<ids.length?ids[i]:ids[ids.length-1]+i-ids.length+1);
					objs[i].ID=id;
					this.db.add({objectType:objs[i].objectType,fields:objs[i].toJSON()});
				}
			}
			
			let updates=[];
			for(let objectType in sortedObjs.preserved)
			{
				let objs=sortedObjs.preserved[objectType],
				ids=this.db.getGroupPart("objectType",objectType).getMap("ID");
				for(let i=0;i<objs.length;i++)
				{
					let found=ids[objs[i].ID];
					if(found)
					{
						found.fields=objs[i].toJSON();
						updates.push(found)
					}
				}
			}
			this.db.update(updates);

			for(let objectType in sortedObjs.friend)
			{
				let objs=sortedObjs.friend[objectType],
					tDb=this.db.getGroupPart("objectType",objectType),
					tDbValues=tDb ? tDb.getValues():null,
					newFriends=[];

				for(let i=0;i<objs.length;i++)
				{
					let json={fields:objs[i].toJSON()};
					if(!tDbValues||tDbValues.findIndex(SC.eq.test(json))==-1)
					{
						json.objectType=objs[i].objectType;
						newFriends.push(json);
					}
				}
				this.db.addAll(newFriends);
			}
			signal.resolve();
		},
		load:function(signal,objClass,pattern,sort)
		{
			let tDb=this.db.getGroupPart("objectType",objClass.prototype.objectType);
			if(!tDb) return signal.resolve([]);

			let pDb;
			if(pattern!=null)
			{
				pattern={fields:pattern};
				let patternKey=SC.eq.patternToString(pattern);
				if(!tDb.hasFilter(patternKey)) tDb.filter(patternKey,pattern);
				pDb=tDb.getFilter(patternKey);
			}
			else pDb=tDb;
			let rtn;
			if(sort)
			{
				sort=[].concat(sort).map(s=>"fields."+s);
				let sortKey=JSON.stringify(sort);
				if(!pDb.hasSort(sortKey)) pDb.sort(sortKey,ORG.attributeSort(sort));
				rtn=pDb.getSort(sortKey);
			}
			else rtn=pDb.getValues();
			rtn=rtn.map(r=>new objClass().fromJSON(r.fields));
			signal.resolve(rtn);
		},
		"delete":function(signal,objClass,toDelete)
		{
			toDelete=this.db.values.filter(SC.eq.test({objectType:objClass.prototype.objectType,fields:DBC.getDeletePattern(objClass,toDelete)}));
			this.db.remove(toDelete);
			signal.resolve(toDelete.map(d=>d.fields.ID));
		},
		destroy:function()
		{
			if(this.db!==OCON.prototype.db)
			{
				this.db.clear();
			}
			this.db=null;
			this.save=this.load=this["delete"]=µ.constantFunctions.ndef;
		},
		_getNextID:function(objectType)
		{
			let rtn=[],
			tDb=this.db.getGroupPart("objectType",objectType);
			if(!tDb)return [0];
			let ids=Object.keys(tDb.getIndexMap("ID"));
			let i=0;
			for(;ids.length>0;i++)
			{
				let index=ids.indexOf(""+i);
				if(index===-1) rtn.push(i);
				else ids.splice(index,1);
			}
			rtn.push(i);
			return rtn;
		}
	});
	
	SMOD("ObjectConnector",OCON);
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	var util=µ.util=µ.util||{};
	var utilArray=util.array=util.array||{};

	//SC=SC({});

	utilArray.remove=function(array,item)
	{
		var index=array.indexOf(item);
		if(index!=-1) array.splice(index,1);
		return index;
	};
	SMOD("array.remove",utilArray.remove);

	utilArray.removeIf=function(array,predicate,all=false,scope=null)
	{
		let count=0;
		if(all)
		{
			for(var i=array.length-1;i>=0;i--)
			{
				if(predicate.call(scope,array[i],i,array))
				{
					array.splice(i,1);
					count++;
				}
			}
		}
		else
		{
			var index=array.findIndex(predicate,scope);
			if(index!=-1)
			{
				array.splice(index,1);
				count++;
			}
		}
		return count;
	};
	SMOD("array.removeIf",utilArray.removeIf);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){
	
	let util=µ.util=µ.util||{};
	let uFn=util.function=util.function||{};

	//SC=SC({});
	
	/** rescope
	 * faster than bind but only changes the scope.
	 */
	uFn.rescope=function(fn,scope)
	{
		if(fn==null||fn.apply==null) throw new TypeError("#rescope:001 function is not defined");
		else return function(...args)
		{
			return fn.call(scope,...args);
		}
	};
	uFn.rescope.all=function(scope,keys)
	{
		keys=keys||Object.keys(scope);
		for(let key of keys)
		{
			if(typeof scope[key]==="function") scope[key]=uFn.rescope(scope[key],scope);
		}
	};
	SMOD("rescope",uFn.rescope);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC)
{

	SC=SC({
		remove:"array.remove",
		rescope:"rescope"
	});

	/**Patch Class
	 * Adds functionality to an instance
	 * 
	 * Patches should not interfere with instances attributes unless specified.
	 * To set attributes on an instance a Patch should use the .proxyToInstance() method.
	 *
	 * A Patch must define a .patch() that doubles as a constructor.
	 *
	 */

	var patchMap=new WeakMap();
	var instanceMap=new WeakMap();

	var Patch=µ.Patch=µ.Class({
		[µ.Class.symbols.onExtend](sub)
		{
			//force .patch() method
			if (!("patch" in sub.prototype )) throw new SyntaxError(`#Patch:001 ${(n=>n?n+" ":"")(sub.constructor.name)}has no patch method`);
		},
		constructor:function Patch(instance,...param)
		{
			this.composedInstanceKeys={};
			if(!patchMap.has(instance))
			{
				patchMap.set(instance,[]);
			}
			else if(!this[Patch.symbols.multiple]&&Patch.getPatches(instance,this.constructor).length>0)
			{
				throw new Error("#Patch:002 instance has already this Patch");
			}
			patchMap.get(instance).push(this);
			instanceMap.set(this,instance);

			Object.defineProperty(this,"instance",{get:()=>instanceMap.get(this)});

			this.patch(...param);
		},
		composeKeys:[],
		composeInstance(keys)
		{
			if(!Array.isArray(keys)) keys=Object.entries(keys);

			keys.forEach(entry=>
			{
				let key,targetKey;

				if(Array.isArray(entry)) ([key,targetKey]=entry);
				else key=targetKey=entry;

				if(this.composeKeys.indexOf(key)==-1) return; //continue

				this.composedInstanceKeys[targetKey]=this.instance[targetKey];

				if(typeof this[key]==="function")
				{
					this.instance[targetKey]=SC.rescope(this[key],this);
				}
				else
				{
					Object.defineProperty(this.instance,targetKey,{
						configurable:true,
						enumerable:true,
						get:()=>this[key],
						set:value=>{this[key]=value}
					});
				}
			});
		},
		destroy()
		{
			for(let key in this.composedInstanceKeys)
			{
				this.instance.key=this.composedInstanceKeys[key];
			}

			SC.remove(patchMap.get(this.instance),this);
			instanceMap.delete(this);
			this.mega();
		}
	});
	Patch.getPatches=function(instance,clazz)
	{
		if(!patchMap.has(instance)) return [];
		let patches=patchMap.get(instance);
		if(clazz) return patches.filter(p=>p instanceof clazz);
		return patches.slice();
	};
	Patch.symbols={
		"multiple":Symbol("multiple")
	};

	SMOD("Patch",Patch);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

    let Patch=GMOD("Patch");

	//SC=SC({});

	let NODE=µ.NodePatch=µ.Class(Patch,{
		[Patch.symbols.multiple]:true,
		composeKeys:["parent","children","addChild","removeChild","setParent","remove","isChildOf","hasChild"],
		patch:function(name,composeKeys=NODE.prototype.composeKeys)
		{
			this.name=name;
			this.parent=null;
			this.children=new Set();

            this.composeInstance(composeKeys);
		},
		_getNode:function(obj)
		{
			let nodes=Patch.getPatches(obj,NODE);
			for(let node of nodes)
			{
				if(node.name===this.name) return node;
			}
			throw new Error("#NodePatch:001 target has no NodePatch"+(this.name?` (${this.name}})`:""));
		},
		check:function(key,target,args)
		{
			let checkFn=this.composedInstanceKeys[key];
			if(checkFn)
			{
				return checkFn.call(this.instance,target,...args);
			}
			return true;
		},
		addChild:function(child,...args)
		{
			if(this.children.has(child)) return true;
			let childNode=this._getNode(child);
            if(this.check("addChild",child,args))
			{
				this.children.add(child);
				if(!childNode.setParent(this.instance,...args))
				{
					this.children.delete(child);
					return false;
				}
				return true;
			}
			return false;
		},
		removeChild:function(child,...args)
		{
			if(!this.children.has(child)) return true;
			let childNode=this._getNode(child);
            if(this.check("removeChild",child,args))
			{
				this.children.delete(child);
				if(!childNode.setParent(null,...args))
				{
					this.children.add(child);
					return false;
				}
				return true;
			}
			return false;
		},
		setParent:function(parent,...args)
		{
			if(this.parent===parent) return true;
			if(this.check("setParent",parent,args))
			{
				let oldParent=this.parent;
				this.parent=parent;
				let oldRemoved=true;
				if(oldParent)
				{
					let oldParentNode=this._getNode(oldParent);
					oldParentNode.removeChild(this.instance,...args);
				}
				let newAdded=true;
				if(oldRemoved&&parent)
				{
					let parentNode=this._getNode(parent);
					newAdded=parentNode.addChild(this.instance,...args);
				}
				if(!oldRemoved||!newAdded)
				{
					this.parent=oldParent;
					return false;
				}
				return true;
			}
			return false;
		},
		remove:function(...args)
		{
			return this.setParent(null,...args);
		},
		destroy:function()
		{
			this.remove();
			for(let child of this.children)
			{
				this.removeChild(child);
			}
			this.mega();
		}
	});

	NODE.Basic=µ.Class({
		constructor:function(name,aliasMap)
		{
			new NODE(this,name,aliasMap);
		},
		destroy()
		{
			for(let child of this.children)
			{
				if(typeof child.destroy==="function")child.destroy();
			}
			this.mega();
		}
	});

	NODE.normalizeChildrenGetter=function(childrenGetter)
	{
		if(!childrenGetter) childrenGetter="children";
		if(typeof childrenGetter == "string") return c=>c[childrenGetter];
		return childrenGetter;
	};

	NODE.traverse=function(root,func,childrenGetter)
	{
		childrenGetter=NODE.normalizeChildrenGetter(childrenGetter);
		let todo=[{
			node:root,
			parent:null,
			parentResult:null,
			siblingResults:[],
			index:null,
			depth:0
		}];
		for(let entry of todo)
		{
			entry.siblingResults.push(func(entry.node,entry.parent,entry.parentResult,entry));
			let children=[];
			children=childrenGetter(entry.node);
			if(children)
			{
				let childSiblings=[];
				let i=0;
				for(let child of children)
				{
					todo.push({
						node:child,
						parent:entry.node,
						parentResult:entry.siblingResults[entry.siblingResults.length-1],
						siblingResults:childSiblings,
						index:i,
						depth:entry.depth+1
					});
					i++;
				}
			}
		}
		return todo[0].siblingResults[0];
	};

	NODE.traverseTo=function(root,path,childrenGetter)
	{
		childrenGetter=NODE.normalizeChildrenGetter(childrenGetter);
		if(typeof path=="string") path=path.split(".");
		for(let key of path)
		{
			root=childrenGetter(root)[key];
			if(!root) return null;
		}
		return root;
	};

	SMOD("NodePatch",NODE);
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);

/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let NodePatch=GMOD("NodePatch");

	//SC=SC({});

	/**
	 * @param {Any} root
	 * @param {Function} compare - (a,b)=>Boolish
	 * @param {String|Function} (childrenGetter)
	 */
	NodePatch.Compare=µ.Class(NodePatch.Basic,{
		constructor:function(newNode,oldNode,compare=µ.constantFunctions.t)
		{
			this.mega();

			this.newNode=newNode;
			this.oldNode=oldNode;
			this.compare=compare;
		},
		isNew:function(){return !this.oldNode},
		isMissing:function(){return !this.newNode},
		isCompareable:function(){return !this.isNew()&&!this.isMissing()},
		isChanged:function(){return this.isCompareable()&&!this.compare(this.newNode,this.oldNode)},
		isUnchanged:function(){return this.isCompareable()&&!this.isChanged()},
		getNew:function(){return Array.from(this.children).filter(c=>c.isNew())},
		getMissing:function(){return Array.from(this.children).filter(c=>c.isMissing())},
		getChanged:function(){return Array.from(this.children).filter(c=>c.isCompareable()&&c.isChanged())},
		getUnchanged:function(){return Array.from(this.children).filter(c=>c.isUnchanged())},

		hasChanges:function()
		{
			return !this.isCompareable()||this.isChanged()||Array.from(this.children).some(c=>c.hasChanges());
		}

	});

	NodePatch.Compare.create=function(newRoot,oldRoot,getId,compare,childrenGetter)
	{
		childrenGetter=NodePatch.normalizeChildrenGetter(childrenGetter);

		let rtn=new NodePatch.Compare(newRoot,oldRoot,compare);
		let todo=[rtn];

		while(todo.length>0)
		{
			let parentCompare=todo.shift();
			if(!parentCompare.isCompareable()) continue;

			let oldChildren=new Map();
			for(let child of childrenGetter(parentCompare.oldNode))
			{
				oldChildren.set(getId(child),child);
			}

			for (let child of childrenGetter(parentCompare.newNode))
			{
				let id=getId(child);
				let oldNode=oldChildren.get(id)
				let childCompare=new NodePatch.Compare(child,oldNode,compare);
				parentCompare.addChild(childCompare);
				if(oldNode)
				{
					todo.push(childCompare);
					oldChildren.delete(id);
				}
			}
			for (let child of oldChildren.values())
			{
				let childCompare=new NodePatch.Compare(null,child,compare);
				parentCompare.addChild(childCompare);
			}
		}
		return rtn;
	};

	SMOD("NodePatch.Compare",NodePatch.Compare);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	var util=µ.util=µ.util||{};
	var array=util.array=util.array||{};

	//SC=SC({});

	var flattenAll=Array.prototype.concat.bind(Array.prototype);

	array.flatten=flattenAll.apply.bind(flattenAll,null);
	array.flatten.all=flattenAll;

	SMOD("flatten",array.flatten);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let obj=util.object=util.object||{};

	//SC=SC({});

	/** uniquify
	 * Creates a copy of {arr} without duplicates.
	 * Generates an ID via {fn}(value)
	 */
	obj.uniquify=function(arr,fn)
	{
		let values;
		if(fn)
		{
			let idMap=new Map();
			for(let i=0;i<arr.length;i++)
			{
				let id=arr[i];
				if(fn)
				{
					id=fn(arr[i]);
				}
				idMap.set(id,arr[i]);
			}
			values=idMap.values();
		}
		else
		{
			values=new Set(arr);
		}
		return Array.from(values);
	};
	SMOD("uniquify",obj.uniquify);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		remove:"array.remove",
		uniquify:"uniquify",
		flatten:"flatten"
	});

	let applyPrefix=function(arr,prefix)
	{
		return (arr||[]).map(function(a){return prefix+a});
	};

	µ.DependencyResolver=µ.Class({
		constructor:function(config,prefix)
		{
			this.config={};
			if(config)this.addConfig(config,prefix);
		},
		addConfig:function(obj,prefix="",overwrite)
		{
			if(typeof obj==="object")
			{
				let keys=Object.keys(obj);
				for(let l=keys.length,i=0;i<l;i++)
				{
					let k=keys[i];
					if(this.config[prefix+k]===undefined||overwrite)//TODO overwrite message
					{
						let v=null;
                        if(typeof obj[k]==="string")
                        {
                            v={deps:[prefix+obj[k]],uses:[]};
                        }
                        else if (Array.isArray(obj[k]))
                        {
                            v={deps:applyPrefix(obj[k],prefix),uses:[]};
                        }
                        else if (obj[k]!==true)
                        {
                            v={deps:applyPrefix(obj[k].deps,prefix),uses:applyPrefix(obj[k].uses,prefix)}
                        }
                        else
                        {
                            v={deps:[],uses:[]};
                        }
						this.config[prefix+k]=v;
					}
				}
				return true;
			}
			µ.logger.error(new TypeError("#DependencyResolver:001 DependencyResolver.addConfig: obj is not an object"));
			return false;
		},
		getConfig:function(item)
		{
			let config=this.config[item];
			if(!config) throw new ReferenceError("#DependencyResolver:002 "+item+" is not in config");
			return config;
		},
		resolve:function(list,allowUsesCycles=false)
		{
			let resolved=new Map();
			let todo=[].concat(list).map(s=>({
				name:s,
				from:[]
			}));

			for(let entry of todo)
			{
				let config=this.getConfig(entry.name);
				if(!resolved.has(entry.name))
				{
					resolved.set(entry.name,{
						name:entry.name,
						from:[]
					});
				}
				let item=resolved.get(entry.name);
				if(entry.from.length!=0)
				{
					item.from.push(entry.from);
				}

				for(let next of config.deps.concat(config.uses))
				{
					let index=entry.from.indexOf(next);
					if(index!=-1)//cycle detected
					{
						let cycle=entry.from.slice(index).concat(entry.name);
						resolved.get(next).from.push(entry.from.slice().concat(entry.name,next));
						if(allowUsesCycles&&(!config.deps.includes(next)||cycle.some(this._containsUses)))
						{
							continue;
						}
						throw new Error("#DependencyResolver:003 cyclic dependency ["+cycle.join(" <-> ")+"]");
					}
					else
					{
						todo.push({
							name:next,
							from:entry.from.concat(entry.name)
						});
					}
				}
			}

			for (let item of resolved.values()) item.from=SC.uniquify(item.from,a=>a.join(","));

			this._breakCycles(resolved);
			let resolvedArr=Array.from(resolved.values());
			return this._sort(resolvedArr);
		},
		_containsUses:function(dependPath)
		{
			return dependPath.some((key,index,array)=>
			{
				return index+1<array.length&&!this.getConfig(key).deps.includes(array[index+1]);
			});
		},
		_breakCycles:function(resolved)
		{
			for (let item of resolved.values())
			{
				for(let index=0;index<item.from.length;index++)
				{
					let path=item.from[index];
					if(path[path.length-1]!==item.name) continue;

					let cycle=path.slice(path.indexOf(item.name),-1);
					item.from.splice(index--,1);
					path=path.slice(0,path.length-1-cycle.length);

					let cycleParts=this._getCycleParts(cycle);
					if(cycleParts===null) continue

					for(let c=0;c<cycle.length;c++)
					{
						let name=cycle[c];
						let cyclePath=path.concat(cycle.slice(0,c));
						let replacePath=path.concat(cycleParts.get(name));
						let searchPath=cyclePath.join(",");
						let cycleItem=resolved.get(name);
						for(let i=0;i<cycleItem.from.length;i++)
						{
							if(cycleItem.from[i].join(",")===searchPath)
							{
								cycleItem.from[i]=replacePath;
								break;
							}
						}
					}
				}
			}
		},
		_getCycleParts:function(cycle)
		{
			let isUseDependent=(name,index,arr)=>
			{
				return index+1<arr.length&&!this.getConfig(name).deps.includes(arr[index+1]);
			};

			let useIndex=cycle.findIndex(isUseDependent);

			if(useIndex==-1) return null; //only use is already solved

			let sortedCycle=cycle.slice(useIndex+1).concat(cycle.slice(0,useIndex+1));

			let useIndexes=sortedCycle.reduce((arr,name,i)=>
			{
				if(isUseDependent(name,i,sortedCycle)) arr.push(i+1);
				return arr;
			},[0]);

			useIndexes.push(sortedCycle.length);

			let parts=new Map();
			useIndexes.reduceRight((to,from)=>
			{
				for(;from<to;to--)
				{
					parts.set(sortedCycle[to-1],sortedCycle.slice(from,to-1));
				}
				return from;
			});

			return parts;
		},
		_sort:function(resolvedArr)
		{
			let rtn=[];
			for(let item of resolvedArr)
			{
				let allFrom=SC.uniquify(SC.flatten(item.from));
				let firstIndex=Math.min(...allFrom.map(f=>rtn.indexOf(f)).filter(i=>i!=-1));

				if(firstIndex==Infinity)
				{
					let config=this.getConfig(item.name);
					let allDeps=config.deps.concat(item.uses);
					let lastIndex=Math.max(...allDeps.map(d=>rtn.lastIndexOf(d)),-1);

					if(lastIndex==-1) rtn.unshift(item.name);
					else rtn.splice(lastIndex+1,0,item.name);
				}
				else
			 	{
			 		rtn.splice(firstIndex,0,item.name);
			 	}
			}
			return rtn;
		},
        clone:function(prefix)
        {
            return new µ.DependencyResolver(this.config,prefix);
        }
	});
	SMOD("DependencyResolver",µ.DependencyResolver);
	SMOD("DepRes",µ.DependencyResolver);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	//SC=SC({});

	let CONFIG=µ.Config=µ.Class({
		[µ.Class.symbols.abstract]:true,
		get:null,
		set:null,// (key,value)=>{} // (value)=>{}
		setDefault:function(def)
		{
			if(def!=null) this.default=def;
			else this.default=null;
		},
		reset:null,
		toJSON:null,
		toDescription:null
	});
	CONFIG.parse=function(desc,value)
	{
		if(typeof desc=="string") return new FIELD({type:desc},value);
		else if (Array.isArray(desc)) return new ARRAY({model:desc[0]},value);
		switch(desc.type)
		{
			case "object":
			case undefined:
				let defaults=desc.default;
				if("model" in desc) desc=desc.model;
				return new OBJECT(desc,defaults,value);
				break;
			case "map":
				return new MAP(desc,value);
				break;
			case "array":
				return new ARRAY(desc,value);
			case "string":
			case "boolean":
			case "number":
			case "select":
				return new FIELD(desc,value);
		}
	}
	SMOD("Config",CONFIG);

	let FIELD=CONFIG.Field=µ.Class(CONFIG,{
		constructor:function(param,value)
		{
			this.type=param.type;
			this.setDefault(param.default);
			this.pattern=null;
			if(typeof param.pattern == "string")
			{
				let match=param.pattern.match(/^\/(.+)\/(.*)$/);
				if(match) this.pattern=new RegExp(match[1],match[2])
				else this.pattern=new RegExp(param.pattern);
				this.pattern.toJSON=RegExp.prototype.toString;
			}
			else if (param.pattern) this.pattern=param.pattern;
			this.validate=param.validate||null;
			this.value=null;

			switch(this.type)
			{
				case "select":
					this.values=param.values;
					this.multiple=param.multiple||false;
					break;
				case "number":
					this.min=param.min;
					this.step=param.step;
					this.max=param.max;
			}

			if(value!==undefined) this.set(value);
			else this.reset();
		},
		get:function()
		{
			return this.value;
		},
		set:function(value)
		{
			if(arguments.length==2) value=arguments[1];
			let validity=this.isValid(value);
			if(validity===true) this.value=value;
			else return validity;
			return true;
		},
		/**
		 * checks value and returns a boolean or any error object from validate callback.
		 * if you want to use validation messages check if isValid(value)===true
		 * @param {*} value
		 * @returns {boolean|*}
		 */
		isValid:function(value)
		{
			return (this.type=="select"
				&& (
					this.multiple
					&& Array.isArray(value)
					&& value.every(v=>this.values.indexOf(v)!=-1) //All select values are valid
					||
					this.values.indexOf(value)!=-1 //select value is valid
				)
			)
			||
			(
				typeof value==this.type
				&& (!this.pattern || this.pattern.test(value))
				&& (this.type!="number"||(
					(this.min==null||value>=this.min)
					&& (this.max==null||value<=this.max)
					&& (this.step==null||value%this.step==0)
					)
				)
				&& (!this.validate|| this.validate(value,this.value)) // type, pattern and validator ok
			);
		},
		reset:function()
		{
			this.value=null;
			this.set(this.default);
		},
		toJSON:function()
		{
			return this.get();
		},
		toDescription:function()
		{
			let rtn={
				type:this.type,
				pattern:this.pattern,
				validate:this.validate,
				default:this.default
			};
			switch(this.type)
			{
				case "select":
					rtn.values=this.values;
					rtn.multiple=this.multiple;
					break;
				case "number":
					rtn.min=this.min;
					rtn.step=this.step;
					rtn.max=this.max;
			}
			return rtn;
		}
	});
	FIELD.TYPES=["string","boolean","number","select"];

	let CONTAINER=CONFIG.Container=µ.Class(CONFIG,{
		[µ.Class.symbols.abstract]:true,
		[Symbol.iterator]:function()
		{
			return this.configs.entries();
		},
		setAll:function(values,create){throw "abstract"},
		get:function(key){throw "abstract"},
		set:function(key,value)
		{
			if(arguments.length==1&&typeof key=="object")
			{
				this.setAll(key,true);
				return true;
			}
			if(!Array.isArray(key))key=[key];
			for(let entry of this)
			{
				if(entry[0]==key[0])return entry[1].set(key.slice(1),value);
			}
			return false;
		}
	});

	let OBJECT=CONTAINER.Object=µ.Class(CONTAINER,{
		constructor:function(configs,defaults,value)
		{
			this.configs=new Map();
			this.setDefault(defaults);
			if(configs)
			{
				this.addAll(configs);
			}

			if(value!==undefined) this.setAll(value,true);
		},
		addAll:function(configs)
		{
			let rtn={};
			for(let key in configs)
			{
				rtn[key]=this.add(key,configs[key]);
			}
			return rtn;
		},
		add:function(key,config)
		{
			if(!(config instanceof CONFIG))config=CONFIG.parse(config);
			if(config)
			{
				if(this.configs.has(key))
				{
					µ.logger.warn(new µ.Warning(String.raw`overwriting config in Object under key ${key}`,{
						old:this.configs.get(key),
						new:config
					}));
				}
				if(this.default && key in this.default) config.setDefault(this.default[key]);
				this.configs.set(key,config);
				return config;
			}
			return false;
		},
		get:function(key)
		{
			if(key==null) return this.toJSON();
			if(!Array.isArray(key)) return this.configs.get(key);
			if(key.length==0) return this;

			let config=this.configs.get(key[0]);
			if(config)
			{
				if(key.length==1) return config;
				return config.get(key.slice(1));
			}

			return undefined;
		},
		remove:function(key)
		{
			if(key instanceof CONFIG)
			{
				for(let entry of this.configs.entries)
				{
					if(entry[1]==key)
					{
						key=entry[0];
						break;
					}
				}
			}
			let rtn=this.configs.get(key);
			this.configs.delete(key);
			return rtn;
		},
		setAll:function(configs,create)
		{
			for(let key in configs)
			{
				if(this.configs.has(key))
				{
					if(this.configs.get(key) instanceof CONTAINER)
					{
						this.configs.get(key).setAll(configs[key],create);
					}
					else this.set(key,configs[key]);
				}
			}
		},
		reset:function()
		{
			for(let config of this.configs.values())
			{
				config.reset();
			}
		},
		toJSON:function()
		{
			let rtn={};
			for(let key of this.configs.keys())
			{
				rtn[key]=this.configs.get(key).toJSON();
			}
			return rtn;
		},
		toDescription:function()
		{
			let rtn={
				type:"object",
				model:{},
				default:this.default
			};
			for(let key of this.configs.keys())
			{
				rtn.model[key]=this.configs.get(key).toDescription();
			}
			return rtn;
		}
	});

	let ARRAY=CONTAINER.Array=µ.Class(CONTAINER,{
		constructor:function(param,value)
		{
			this.model=param.model;
			this.setDefault(param.default);
			this.configs=[];
			Object.defineProperty(this,"length",{
				configurable:false,
				enumerable:true,
				get:()=>this.configs.length
			});

			if(value!==undefined) this.setAll(value,true);
			else this.reset();
		},
		pushAll:function(configs)
		{
			return configs.map(config=>this.push(config));
		},
		push:function(config)
		{
			let model;
			if(this.default&&this.default.length>this.configs.length)
			{
				if(typeof this.model=="string") model={type:this.model};
				else model=Object.create(this.model);
				model.default=this.default[this.configs.length];
			}
			else model=this.model;
			let value=CONFIG.parse(model);
			if(value&&(config===undefined||value.set(config)))
			{
				this.configs.push(value);
				return value;
			}
			return false;
		},
		get:function(key)
		{
			if(key==null) return this.toJSON();
			if(!Array.isArray(key))
			{
				if(key>=0&&key<this.configs.length) return this.configs[key];
				return undefined;
			}
			if(key.length==0) return this;
			if(key[0]>=0&&key[0]<this.configs.length)
			{
				let config=this.configs[key[0]];
				if(key.length==1) return config;
				return config.get(key.slice(1));
			}
			return undefined;
		},
		splice:function(index)
		{
			if(index instanceof CONFIG)
			{
				index=this.configs.indexOf(index);
			}
			return this.configs.splice(index,1)[0];
		},
		setAll:function(values,create)
		{
			if(create&&this.configs.length>values.length) this.configs.length=values.length
			for(let index=0;index<values.length;index++)
			{
				if(create&&this.configs.length<=index) this.push(values[index]);
				else this.set(index,values[index]);
			}
		},
		reset:function()
		{
			this.configs.length=0;
			if(this.default)
			{
				let _model;
				if(typeof this.model=="string"||!("default" in this.model))_model=this.model;
				else
				{
					_model=Object.create(this.model);
					_model.default=undefined;
				}
				while (this.configs.length<this.default.length)
				{
					this.configs.push(CONFIG.parse(_model));
				}
				for(let i=0;i<this.configs.length;i++)
				{
					this.configs[i].setDefault(this.default[i]);
					this.configs[i].reset();
				}
			}
		},
		toJSON:function()
		{
			return this.configs.map(f=>f.toJSON());
		},
		toDescription:function()
		{
			return {
				type:"array",
				model:this.model,
				default:this.default
			};
		}
	});

	let MAP=CONTAINER.Map=µ.Class(CONTAINER,{
		constructor:function(param,value)
		{
			this.model=param.model;
			this.setDefault(param.default);
			this.configs=new Map();

			if(value!==undefined) this.setAll(value,true);
			else this.reset();
		},
		addAll:function(configs)
		{
			let rtn={};
			for(let key in configs)
			{
				rtn[key]=this.add(key,configs[key]);
			}
			return rtn;
		},
		add:function(key,config)
		{
			let value=CONFIG.parse(this.model);
			if(value&&key!==undefined&&(config===undefined||value.set(config)))
			{
				if(this.configs.has(key))
				{
					µ.logger.warn(`overwriting config in Object under key ${key}`);
				}
				this.configs.set(key,value);
				return value;
			}
			return false;
		},
		get:function(key)
		{
			if(key==null) return this.toJSON();
			if(!Array.isArray(key)) return this.configs.get(key);
			if(key.length==0) return this;

			let config=this.configs.get(key[0])
			{
				if(key.length==1) return config;
				return config.get(key.slice(1));
			}

			return undefined;
		},
		remove:function(key)
		{
			if(key instanceof CONFIG)
			{
				for(let entry of this.configs.entries)
				{
					if(entry[1]==key)
					{
						key=entry[0];
						break;
					}
				}
			}
			let rtn=this.configs.get(key);
			this.configs.delete(key);
			return rtn;
		},
		setAll:function(values,create)
		{
			if(create)
			{
				for(let key of this.configs.keys())
				{
					if(!(key in values))
					{
						this.configs.delete(key);
					}
				}
			}
			for(let key in values)
			{
				if(create&&!this.configs.has(key)) this.add(key,values[key]);
				else this.set(key,values[key]);
			}
		},
		reset:function()
		{
			this.configs.clear();
			if(this.default)
			{
				let _model;
				if(typeof this.model=="string"||!("default" in this.model))_model=this.model;
				else
				{
					_model=Object.create(this.model);
					_model.default=undefined;
				}
				for(let key in this.default)
				{
					let config=CONFIG.parse(_model);
					this.configs.set(key,config);
					config.setDefault(this.default[key]);
					config.reset();
				}
			}
		},
		toJSON:function()
		{
			let rtn={};
			for(let key of this.configs.keys())
			{
				rtn[key]=this.configs.get(key).toJSON();
			}
			return rtn;
		},
		toDescription:function()
		{
			return {
				type:"map",
				model:this.model,
				default:this.default
			};
		},
		keys:function()
		{
			return Array.from(this.configs.keys());
		}
	});

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);

/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let Patch=GMOD("Patch");

	SC=SC({
		removeIf:"array.removeIf"
	});

	let globalScope=this;

	let cSym=µ.Class.symbols;

	let firstLowerCase=/^[a-z]/;
	let eventNamePattern=/^[a-z_][a-zA-Z_.:\-@#]+$/;
	let abstractImplementor=function(name)
	{
		if(typeof name==="string")
		{
			name={name:name};
		}
		return name;
	};

	let eventClassesMap=new Map();

	µ.Event=µ.Class({
		[cSym.onExtend]:function(sub)
		{
			let sProt=sub.prototype;
			if(!sProt.hasOwnProperty("name")||!sProt.name) throw new SyntaxError("#Event:001 Event has no name");
			if(!sProt.name.match(eventNamePattern)) throw new RangeError("#Event:002 Event name does not match pattern "+eventNamePattern);
			if(eventClassesMap.has(sProt.name)) throw new RangeError("#Event:003 Event name must be unique");

			eventClassesMap.set(sProt.name,sProt.constructor);
		},
		[cSym.abstract]:abstractImplementor,
		constructor:function Event(){}
	});
	SMOD("Event",µ.Event);



	µ.Event.StateEvent=µ.Class(µ.Event,{
		[cSym.abstract]:abstractImplementor,
		constructor:function StateEvent(state)
		{
			this.state=state;
		}
	});
	SMOD("StateEvent",µ.Event.StateEvent);



	µ.Event.CancelEvent=µ.Class(µ.Event,{
		[cSym.abstract]:abstractImplementor,
		constructor:function CancelEvent()
		{
			this.phase=CancelEvent.phases.CHECK;
		}
	});
	µ.Event.CancelEvent.phases={
		CHECK:"check",
		DONE:"done"
	};
	SMOD("CancelEvent",µ.Event.CancelEvent);



	µ.Event.ErrorEvent=µ.Class(µ.Event,{
		name:"error",
		constructor:function(reason,cause)
		{
			//                                  ErrorEvent is undefined in nodeJs
			if(reason instanceof Error||(typeof ErrorEvent!=="undefined"&&reason instanceof ErrorEvent))
			{
				cause=reason;
				reason=reason.message;
			}
			this.reason=reason;
			this.cause=cause;
		},
		toString()
		{
			return this.reason+"\n"+this.cause;
		}
	});
	SMOD("ErrorEvent",µ.Event.ErrorEvent);
	


	let getListenerPatch=function(scope)
	{
		return Patch.getPatches(scope,ListenerPatch)[0];
	};
	let checkListenerPatch=function(scope,reporter)
	{
		if(scope&&globalScope!==scope)
		{
			let listenerPatch=getListenerPatch(scope);
			if(!listenerPatch)
			{
				listenerPatch=new ListenerPatch(scope);
			}
			listenerPatch.add(reporter);
		}
	};

	let EventRegister=µ.Class({
		constructor:function()
		{
			this.listeners=[];
		},
		add(scope=null,fn)
		{
			this.listeners.push([scope,fn]);
		},
		has(scope=null)
		{
			return this.listeners.findIndex(([s])=>s===scope)!==-1;
		},
		remove(scope,fn)
		{
			SC.removeIf(this.listeners,([s,f])=>s===scope&&(!fn||fn===f),true);
		},
		report:function(event)
		{
			for(let [scope,fn] of this.listeners) fn.call(scope,event);
		},
		destroy()
		{
			this.listeners.length=0;
			this.mega();
		},
		getScopes()
		{
			return this.listeners.map(a=>a[0]);
		}
	});
	
	
	
	let StateEventRegister=µ.Class(EventRegister,{
		constructor:function()
		{
			this.mega();
			this.lastState=null;
		},
		add(scope=null,fn)
		{
			this.mega(scope,fn)
			if(this.lastState) fn.call(scope,this.lastState);
		},
		report(event)
		{
			this.mega(event);
			this.lastState=event;
		}
	});
	
	
	let CancelEventRegister=µ.Class(EventRegister,{
		constructor:function()
		{
			this.mega();
			this.checkListeners=[];
		},
		add(scope=null,fn,phase)
		{
			if(phase)
			{
				this.checkListeners.push([scope,fn]);
			}
			else
			{
				this.mega(scope,fn);
			}
		},
		has(scope=null)
		{
			return this.mega(scope)&&this.checkListeners.findIndex(([s])=>s===scope)!==-1;
		},
		remove(scope,fn,phase)
		{
			if(phase) SC.removeIf(this.checkListeners,([s,f])=>s===scope&&(!fn||fn===f),true);
			else this.mega(scope);
		},
		report(event,fn)
		{
			event.phase=µ.Event.CancelEvent.phases.CHECK;
			for(let [scope,fn] of this.checkListeners)
			{
				if(fn.call(scope,event)===false)
				{
					return;
				}
			}
			fn(event);
			event.phase=µ.Event.CancelEvent.phases.DONE;
			this.mega(event);
		},
		destroy()
		{
			this.checkListeners.length=0;
			this.mega();
		},
		getScopes()
		{
			let scopes=this.mega();
			this.checkListeners.forEach(a=>scopes.push(a[0]));
			return scopes;
		}
	});
	
	

	let ReporterPatch=µ.Event.ReporterPatch=µ.Class(Patch,{
		patch(eventClasses=[],keys=ReporterPatch.defaultKeys)
		{
			this.eventMap=new Map();
			for(let eventClass of eventClasses) this.introduce(eventClass);
			this.composeInstance(keys);
		},
		composeKeys:["introduce","add","remove","report"],
		introduce(eventClass)
		{
			if(!this.eventMap.has(eventClass))
			{
				let eventRegister;
				if(eventClass.prototype instanceof µ.Event.StateEvent)
				{
					eventRegister=new StateEventRegister(this);
				}
				else if(eventClass.prototype instanceof µ.Event.CancelEvent)
				{
					eventRegister=new CancelEventRegister(this);
				}
				else
				{
					eventRegister=new EventRegister(this);
				}

				this.eventMap.set(eventClass.prototype.constructor,eventRegister);
			}
			return this;
		},
		add(eventName,scope=null,fn,phase)
		{
			let eventClass=eventClassesMap.get(eventName);
			if(!eventClass) throw new ReferenceError(`#ReporterPatch:001 Event class with name ${eventName} does not exist`);
			if(!this.eventMap.has(eventClass)) throw new ReferenceError(`#ReporterPatch:002 Event ${eventName} is not introduced`);
			if(typeof fn!=="function") throw new TypeError("#ReporterPatch:003 fn is not a function");
			this.eventMap.get(eventClass).add(scope,fn,phase);

			if(scope!=null&&scope!=globalScope) checkListenerPatch(scope,this);
		},
		remove(eventName,scope,fn,phase)
		{
			let eventClass=eventClassesMap.get(eventName);
			if(!eventClass||!this.eventMap.has(eventClass)) return;
			this.eventMap.get(eventClass).remove(scope,fn,phase);
			if(scope!=null&&scope!=globalScope)
			{// removed && not global
				for(let eventRegister of this.eventMap.values()) if (eventRegister.has(scope)) return ;
				
				let listenerPatch=getListenerPatch(scope);
				listenerPatch.remove(this);
			}
		},
		removeScope:function(scope)
		{
			for(let eventRegister of this.eventMap.values())
			{
				eventRegister.remove(scope);
			}
		},
		report(event,fn)
		{
			if(!this.eventMap.has(event.constructor)) throw new ReferenceError(`#ReporterPatch:004 tried to report unintroduced Event ${event.name}`);
			this.eventMap.get(event.constructor).report(event,fn);
			return event.phase!==µ.Event.CancelEvent.phases.CHECK;
		},
		destroy()
		{
			let scopes=new Set();
			for(let eventRegister of this.eventMap.values())
			{
				eventRegister.getScopes().forEach(s=>scopes.add(s));
				eventRegister.destroy();
			}
			scopes.delete(null);
			scopes.delete(globalScope);
			scopes.forEach(scope=>getListenerPatch(scope).remove(this));
			this.mega();
		}
	});
	ReporterPatch.defaultKeys={
		add:"addEventListener",
		remove:"removeEventListener",
		report:"reportEvent"
	};
	SMOD("EventReporterPatch",ReporterPatch);



	let ListenerPatch=µ.Event.ListenerPatch=µ.Class(Patch,{
		patch()
		{
			this.reporters=new Set();
		},
		add(reporter)
		{
			this.reporters.add(reporter);
		},
		remove(reporter)
		{
			this.reporters.delete(reporter);
		},
		destroy()
		{
			for(let reporter of this.reporters) reporter.removeScope(this.instance);
			this.reporters.clear();
			this.mega();
		}
	});
	SMOD("EventListenerPatch",ListenerPatch);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		rs:"rescope"
	});
	
	let rescopeApply=function rescopeApply(fn,scope)
	{
		if(fn)return function(arr)
		{
			return fn.apply(scope,arr);
		};
	};

	let AbortHandle=function(reject)
	{
		let callbacks=new Set();

		return {
			add:SC.rs(callbacks.add,callbacks),
			remove:SC.rs(callbacks.delete,callbacks),
			trigger:function()
			{
				let calls=[];
				for(let callback of callbacks)
				{
					try
					{
						calls.push(callback());
					}
					catch (e)
					{
						calls.push(e);
					}
				}
				callbacks.clear();
				reject("abort");
				return Promise.all(calls);
			}
		};
	};
	/**
	 * Promise wrapper to provide arguments,scope and abort().
	 * scope is also provided to all chained methods.
	 */
	let PROM=µ.Promise=µ.Class({
		/**
		 * 
		 * @param {Function|Promise|Array<Function|Promise>} fns
		 * @param {object} (opts={})
		 * @param {object} (opts.scope=null)
		 * @param {object} (opts.args=[])
		 * @param {object} (opts.simple=false)
		 */
		constructor:function(fns,{scope=null,args=[],simple=false}={})
		{
			SC.rs.all(this,"abort");

			this.scope=scope;
			
			let resolve;
			let reject;

			this.original=new Promise(function(rs,rj)
			{
				resolve=rs;
				reject=rj;
			});

			let abortHandle=AbortHandle(reject);
			this.abort=abortHandle.trigger;
			
			// prepare functions
			args=[].concat(args);
			fns=[].concat(fns).map((fn)=>
			{
				if(typeof fn==="function")return new Promise((rs,rj)=>
				{
					let fnArgs=args.slice();
					if(!simple)
					{
						let signal={
							resolve:rs,
							reject:rj,
							scope:scope,
							addAbort:abortHandle.add,
							removeAbort:abortHandle.remove
						};
						fnArgs.unshift(signal);
					}
					try
					{
						let result=fn.apply(scope,fnArgs);
						if(simple)
						{
							rs(result);
						}
						else if (result)
						{
							µ.logger.warn("#Promise:001 function has a result but isn't called in simple mode");
						}
					}
					catch (e)
					{
						µ.logger.error(e);
						µ.logger.error(e.stack);
						rj(e);
					}
				});
				return fn;
			});
			Promise.all(fns).then(resolve,reject);
		},
		_rescopeFn:rescopeApply,// first: apply result of Promise.all | then: only rescope
		_wrapNext:function _wrapNext(next)
		{
			return {
				original:next,
				scope:this.scope,
				then:PROM.prototype.then,
				catch:PROM.prototype.catch,
				_rescopeFn:SC.rs,
				always:PROM.prototype.always,
				reverse:PROM.prototype.reverse,
				_wrapNext:_wrapNext
			};
		},
		"catch":function(efn)
		{
			// use pass function to unwrap results on first call
			return this.then(µ.constantFunctions.pass,efn);
		},
		then:function(fn,efn)
		{
			if(fn)fn=this._rescopeFn(fn,this.scope);
			if(efn)efn=SC.rs(efn,this.scope);
			return this._wrapNext(this.original.then(fn,efn));
		},
		always:function(fn)
		{
			return this.then(fn,fn);
		},
		reverse:function(rejectValue,fn)
		{
			if(fn)fn=SC.rs(fn,this.scope);
			return PROM.reverse(this,rejectValue,fn);
		},
		// abort:function(){} set in constructor
		destroy:function()
		{
			this.abort();
			this.mega();
		}
	});
	PROM.isThenable=function(thenable)
	{
		return thenable&&typeof thenable.then==="function";
	};
	PROM.pledge=function(fn,scope,args=[])
	{
		args=[].concat(args);
		return function vow()
		{
			let vArgs=args.concat(Array.from(arguments));
			return new PROM(fn,{args:vArgs,scope:scope});
		}
	};
	PROM.pledgeAll=function(scope,keys)
	{
		keys=keys||Object.keys(scope);
		for(let i=0;i<keys.length;i++)
		{
			if(typeof scope[keys[i]]==="function")scope[keys[i]]=PROM.pledge(scope[keys[i]],scope);
		}
	};
	PROM.wrap=function(thenable,scope)
	{
		return PROM.prototype._wrapNext.call({scope:scope},thenable);
	};
	/* creates a pending Promise and attaches its resolve and reject to it */
	PROM.open=function(scope)
	{
		let rtn=PROM.prototype._wrapNext.call({
			scope:scope
		});
		rtn.original=new Promise((rs,rj)=>{rtn.resolve=rs;rtn.reject=rj});
		return rtn;
	};
	PROM.resolve=function(value,scope)
	{
		let rtn=PROM.prototype._wrapNext.call({
			scope:scope
		});
		rtn.original=Promise.resolve(value);
		return rtn;
	};
	PROM.reject=function(value,scope)
	{
		let rtn=PROM.prototype._wrapNext.call({
			scope:scope
		});
		rtn.original=Promise.reject(value);
		return rtn;
	};
	/** reverses the outcome of a thenable */
	PROM.reverse=function(thenable,rejectValue,fn)
	{
		if(!fn) fn=µ.constantFunctions.pass;
		return thenable.then(function()
		{
			return Promise.reject(rejectValue);
		},fn);
	};
	/**
	 *
	 * @param {Any[]} arr - array of functions or parameter for mapper
	 * @param {Function} (mapper) - function to be called for every entry in arr
	 */
	PROM.chain=async function(arr,mapper)
	{
		let results=[];
		let index=0;
		for(let entry of arr)
		{
			if(mapper) results.push(await mapper(entry,index++));
			else results.push(await entry());
		}
		return results;
	};
	SMOD("Promise",PROM);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		Event:"Event",
		Reporter:"EventReporterPatch",
		ErrorEvent:"ErrorEvent",
		StateEvent:"StateEvent",
		Promise:"Promise"
	});

	let ID_COUNTER=0;
	let REQUEST_COUNTER=0;

	let AbstractWorker=µ.AbstractWorker=µ.Class({
		[µ.Class.symbols.abstract]:true,
		[µ.Class.symbols.onExtend]:function(sub)
		{
			if(typeof sub.prototype._send!="function") throw new SyntaxError("#AbstractWorker:001 _send() is not defined");
			if(typeof sub.prototype._start!="function") throw new SyntaxError("#AbstractWorker:002 _start() is not defined");
		},
		constructor:function({startTimeout,loadScripts,autoStart=true}={})
		{
			this.requestMap=new Map();
			this.id=ID_COUNTER++;
			this.ready=null;
			this.onFeedback=null;

			let reporter=new SC.Reporter(this,[WorkerStateEvent,WorkerMessageEvent,SC.ErrorEvent]);


			let state;
			Object.defineProperty(this,"state",{
				enumerable:true,
				configurable:true,
				get:function()
				{
					return state;
				},
				set:(newState)=>
				{
					state=newState;
					if(newState===AbstractWorker.states.CLOSE)
					{
						this.ready=new SC.Promise.reject("closed",this);
						this.ready.catch(µ.constantFunctions.pass); //suppress uncaught promise/exception
					}
					reporter.report(new WorkerStateEvent(newState));
				}
			});
			this.state=AbstractWorker.states.CLOSE;

			if(autoStart) this.restart(startTimeout,loadScripts);
		},
//		_send:function(payload){},
//		_start:function(){}, // propagate id and other parameters to actual worker
		_onMessage(message)
		{
			if("request" in message)
			{
				if(!this.requestMap.has(message.request))
				{
					this.reportEvent(new SC.ErrorEvent("no such request",`request ${message.request} is not known`));
				}
				else
				{
					if(message.error) this.requestMap.get(message.request).reject(message.error);
					else this.requestMap.get(message.request).resolve(message.data);
				}
			}
			else if("feedback" in message)
			{
				if(!this.onFeedback)
				{
					this._send({feedback:message.feedback,error:"no feedback handler"});
				}
				else
				{
					let feedbackPromise=null;
					try
					{
						feedbackPromise=Promise.resolve(this.onFeedback(message.data))
						.catch(function(error)
						{
							if(error instanceof Error) error=error.message+"\n"+error.stack;
							return Promise.reject(error);
						});
					}
					catch(e)
					{
						feedbackPromise=Promise.reject(e.message+"\n"+e.stack);
					}

					feedbackPromise.then(
						result=>this._send({feedback:message.feedback,data:result}),
						error=>this._send({feedback:message.feedback,error:error})
					)
					.catch(µ.logger.error);
				}
			}
			else if ("error" in message)
			{
				if(this.requestMap.has("init"))this.requestMap.get("init").reject(message.error);
				else this.reportEvent(new SC.ErrorEvent(message.error));
			}
			else
			{
				this.reportEvent(new WorkerMessageEvent(message));
			}
		},
		send(method,args=[])
		{
			if(this.state!==AbstractWorker.states.OPEN) throw new Error("#AbstractWorker:003 worker is not open");

			this._send({method:method,args:args});
			return this;
		},
		request(method,args=[],timeout=AbstractWorker.defaults.TIMEOUT)
		{
			if(this.state!==AbstractWorker.states.OPEN) return SC.Promise.reject(new Error("#AbstractWorker:004 worker is not open"),this);

			let requestData={
				request:REQUEST_COUNTER++,
				method:method,
				args:args
			};
			let timer;
			let promise=new SC.Promise(function(signal)
			{
				this.requestMap.set(requestData.request,signal);
				timer=setTimeout(function()
				{
					signal.reject("timeout");
				},timeout);
				this._send(requestData);
				signal.addAbort(function()
				{
					this._send({
						request:requestData.request,
						method:"_abort"
					});
				})
			},{scope:this});
			promise.always(function()
			{
				this.requestMap.delete(requestData.request);
				clearTimeout(timer);
			});
			return promise;
		},
		stop(timeout)
		{
			return this.request("stop",[],timeout);
		},
		restart(timeout=AbstractWorker.defaults.TIMEOUT,loadScripts)
		{
			if(this.state!==AbstractWorker.states.CLOSE) throw SC.Promise.reject(new Error("#AbstractWorker:005 worker is already open"),this);
			let timer;
			this.state=AbstractWorker.states.START;
			this.ready=new SC.Promise(function(signal)
			{
				this.requestMap.set("init",signal);
				timer=setTimeout(function()
				{
					signal.reject("timeout");
				},timeout);
			},{scope:this});

			this._start();

			this.ready.always(function()
			{
				this.requestMap.delete("init");
				clearTimeout(timer);
			});

			this.ready.then(function()
			{
				this.state=AbstractWorker.states.OPEN;
			},
			function()
			{
				this.state=AbstractWorker.states.CLOSE;
			});

			if(loadScripts)
			{
				this.ready=this.ready.then(initParam=>
					this.request("loadScripts",[loadScripts])
					.then(()=>initParam)
				);
			}

			return this.ready;
		},
		destroy()
		{
			if(this.state!==AbstractWorker.states.CLOSE)
			{
				this.state=AbstractWorker.states.CLOSE; // trigger workerState Event
				this.stop();
			}
			this.mega();
		}
	});
	AbstractWorker.states={
		START:"start",
		OPEN:"open",
		CLOSE:"close",
	};
	AbstractWorker.defaults={
		TIMEOUT:60000
	};
	SMOD("AbstractWorker",AbstractWorker);

	let WorkerMessageEvent=AbstractWorker.WorkerMessageEvent=µ.Class(SC.Event,{
		name:"workerMessage",
		constructor:function(message)
		{
			this.data=message.data;
			this.time=new Date();
			this.raw=message;
		}
	});

	let WorkerStateEvent=AbstractWorker.WorkerStateEvent=SC.StateEvent.implement("workerState");


})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
/********************/
(function(µ,SMOD,GMOD,HMOD,SC){

	let AbstractWorker=GMOD("AbstractWorker");

	//SC=SC({});
	
	let WORKER=µ.Worker=µ.Class(AbstractWorker,{
		constructor:function(param={})
		{
			({
				basePath:this.basePath=WORKER.defaults.BASE_PATH,
				workerScript:this.workerScript=WORKER.defaults.SCRIPT,
				workerBasePath:this.workerBasePath=WORKER.defaults.WORKER_BASE_PATH, //relative from path of loaded script
				morgasPath:this.morgasPath=WORKER.defaults.MORGAS_PATH, // relative from workerBasePath
			}=param);

			this.mega(param);
		},
		_start:function()
		{
			this.worker=new Worker(this.basePath+this.workerScript);
			this.worker.onmessage = msg=>this._onMessage(msg.data);
			this.worker.onerror = error=>this._onMessage({error:error});

			this._send({
				id:this.id,
				basePath:this.workerBasePath,
				morgasPath:this.morgasPath
			});
		},
		_send(payload)
		{
			this.worker.postMessage(payload);
		},
		stop:function()
		{
			this.mega();
			this.state=AbstractWorker.states.CLOSE;
		},
		destroy:function()
		{
			this.worker.terminate();
			this.state=AbstractWorker.states.CLOSE;
			this.mega();
		}
	});
	WORKER.defaults={
		BASE_PATH:"js/",
		SCRIPT:"Worker/BaseWorker.js",
		WORKER_BASE_PATH:"../", //relative from path of loaded script
		MORGAS_PATH:"Morgas.js", // relative from WORKER_BASE_PATH
	};
	
	SMOD("Worker",WORKER);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
//# sourceMappingURL=Morgas-0.8.7.js.map