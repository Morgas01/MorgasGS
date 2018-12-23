let path=require("path");

exports.dirname=path.resolve(__dirname,"src");

if(Morgas)
{// Morgas.js is loaded
	Morgas.addResourceFolder(exports.dirname);
}
