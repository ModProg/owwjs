import _ = require('underscore')

//import { findParan } from './helper'

// import { findEnd, returnEnd, findParan } from './helper';
// import _ = require('underscore');

// console.log(returnEnd("asd asd", / |s/))

// console.log(/((?<=^:.*?) and )/.exec("5:4 and 5"))
// console.log(/((?<=^:.*?) and )/.exec(":4 and 5"))

// console.log([..."test"]);
// let lwoc = (v: string) => v.replace(/\/\/[^]*?($|\n)|\*\/[^](\*\/|$|[\n\s]*)/g, "")
// let lines = ["//asd", " ", "", ""]
// let a = /^\s*["',+\-*/\^&=|]/.test(lwoc((_.find(lines, (v, i, list) => /^\S/.test(lwoc(v)) || list.length - 1 == i) as string)))
// console.log(a)
// export function findParan(text: string, paran: string, skipString = true, direction: -1 | 1 = 1): number {
// 	if (direction < 0){
// 		text = text.split("").reverse().join("")
// 		paran = paran.split("").reverse().join("")
// 	}
// 	var level = 1
// 	text = text.substring(1)
// 	let string = false
// 	for (let i = 0; i < text.length; i++) {
// 		if (string) {
// 			if (/["']/.test(text[i]))
// 				string = false
// 		} else if (skipString && /["']/.test(text[i]))
// 			string = true
// 		else
// 			switch (text[i]) {
// 				case paran[0]:
// 					level++
// 					break;
// 				case paran[1]:
// 					level--
// 					if (level == 0)
// 						if (direction == -1)
// 							return text.length - i-1
// 					return i + 1
// 			}
// 	}
// 	return -1
// }
// console.log(findParan("a[lol]", "[]", true, -1))

console.log(_.findLastIndex(["elem","elem","lol"],(e)=>e=="elem"))