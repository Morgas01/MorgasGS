(function(){

	window.tests={
		loadMorgas:function(name)
		{
			document.write(String.raw`<script type="application/javascript" charset="utf-8" src="/Morgas.js/src/${name}.js" defer></script>`);
		},
		loadTest:function(name,noStyle)
		{
			document.write(String.raw`<script type="application/javascript" charset="utf-8" src="../src/${name}.js" defer></script>`);
			document.write(String.raw`<script type="application/javascript" charset="utf-8" src="tests/${name}.js" defer></script>`);
		}
	};

})();