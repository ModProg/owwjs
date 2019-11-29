import _ = require("underscore")

function toCamelSep(input: string): string {
	return _.map(input.split(/(?<=\p{Lowercase_Letter})\B(?=\p{Uppercase_Letter}|\p{Number})/u).join(" ").split(/\s/), (v) => (v[0]||"").toUpperCase() + v.substr(1)).join(" ")

}

console.log(toCamelSep("testToTest"));
console.log(toCamelSep("testWITHallUppercase"))
console.log(toCamelSep(""))

var s =""
console.log('toType("color", false), toType("button", false), toType("status", false),toType("teamConst", false, "Team Constant"), toType("playerConst", false, "Player Constant"),toType("shortVisualEffect", false), toType("shortAudibleEffect", false),oType("longVisualEffect", false), toType("longAudibleEffect", false),toType("string", false, "String Constant"), toType("communicate", false),toType("icon", false), toType("space", false), toType("hudLocation", false),toType("hero"), toType("player"), toType("bool", true, "Boolean"), toType("number"), toType("vector"), toType("team"),toType("undefined")'.replace(/"\w*"/g,(v=>{
	
	return "type."+v.substring(1,v.length-1)})))
console.log(s)