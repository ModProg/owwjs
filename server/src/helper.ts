import { Type, TypE, Prop, VarProp, Value, ArrayType, ArrayInit, Variable } from './types';
import _ = require('underscore');
import { VariableBlock } from './typeUtil';



export function toCamelSep(input: string): string {
	return _.map(input.split(/(?<=\p{Lowercase_Letter})\B(?=\p{Uppercase_Letter}|\p{Number})/u).join(" ").split(/\s/), (v) => (v[0] || "").toUpperCase() + v.substr(1)).join(" ")
}

export function splitWP(input: string | undefined | null, split: RegExp, max = Number.MAX_SAFE_INTEGER, ...parans: string[]): string[] {
	if (!input)
		return []
	if (parans.length == 0)
		parans.push("()", "[]", "{}")
	if (max < 1) max = Number.MAX_SAFE_INTEGER
	split = new RegExp("^(" + split.source + ")", split.flags)
	var level: number[] = _.map(parans, () => 0)
	var array: string[] = []
	var lastInd = 0
	for (let index = 0; index < input.length && array.length < max - 1; index++) {
		let m = input.substring(index).match(split)

		if (m) {
			if (trueForEach(level, 0)) {
				array.push(input.substring(lastInd, index))
				lastInd = index + m[0].length

			}
		}
		for (let i = 0; i < parans.length; i++) {
			if (input[index] == parans[i][0]) {
				level[i]++
				break;
			}
			else if (input[index] == parans[i][1]) {
				level[i]--
				break;
			}
		}

	}

	array.push(input.substring(lastInd))
	return array
}

export function splitWPToken(input: string | undefined | null, split: RegExp, max = Number.MAX_SAFE_INTEGER, ...parans: string[]): string[] {
	if (!input)
		return []
	if (parans.length == 0)
		parans.push("()", "[]", "{}")
	if (max < 1) max = Number.MAX_SAFE_INTEGER
	if (/\?\<target\>/.test(split.source))
		split = new RegExp("^(" + split.source + ")", split.flags)
	else
		split = new RegExp("^(?<target>" + split.source + ")", split.flags)
	var level: number[] = _.map(parans, () => 0)
	var array: string[] = []
	var lastInd = 0
	for (let index = 0; index < input.length && array.length < max - 1; index++) {
		let m = input.substring(index).match(split)

		if (m && m.groups) {
			if (trueForEach(level, 0)) {
				array.push(input.substring(lastInd, index))
				array.push(m.groups.target)
				lastInd = index + m[0].length
				index += m[0].length - 1


			}
		}
		for (let i = 0; i < parans.length; i++) {
			if (input[index] == parans[i][0]) {
				level[i]++
				break;
			}
			else if (input[index] == parans[i][1]) {
				level[i]--
				break;
			}
		}

	}

	array.push(input.substring(lastInd))
	return array
}

export function trueForEach(array: any[], value: any = true, condition?: (value: any) => boolean): boolean {

	if (condition != undefined)
		for (let i = 0; i < array.length; i++) {
			if (!condition(array[i]))
				return false
		}
	else
		for (let i = 0; i < array.length; i++) {
			if (array[i] != value)
				return false
		}
	return (true)
}

export function trueForAny(array: any[], value: any = true, condition?: (value: any) => boolean): boolean {

	if (condition != undefined)
		for (let i = 0; i < array.length; i++) {
			if (condition(array[i]))
				return true
		}
	else
		for (let i = 0; i < array.length; i++) {
			if (array[i] == value)
				return true
		}
	return (false)
}

export function findParan(text: string, paran: string, skipString = true, direction: -1 | 1 = 1): number {
	if (direction < 0) {
		text = text.split("").reverse().join("")
		paran = paran.split("").reverse().join("")
	}
	if (paran.length < 2 || !text.startsWith(paran[0]))
		return -1
	var level = 1
	text = text.substring(1)
	let string = false
	for (let i = 0; i < text.length; i++) {
		if (string) {
			if (/["']/.test(text[i]))
				string = false
		} else if (skipString && /["']/.test(text[i]))
			string = true
		else
			switch (text[i]) {
				case paran[0]:
					level++
					break;
				case paran[1]:
					level--
					if (level == 0)
						if (direction == -1)
							return text.length - i - 1
						else
							return i + 1
			}
	}
	return -1
}


export function toTitle(text: string): string {
	return text.toLowerCase().replace(/\b\w/g, (v) => v.toUpperCase())
}


export function findEnd(text: string, regex: RegExp, skipString = true): number {
	return returnEnd(text, regex, skipString)[0]
}

export function returnEnd(text: string, regex: RegExp, skipString = true): [number, string] {
	regex = new RegExp("^(?<end>" + regex.source + ")")
	let string = false
	for (let i = 0; i < text.length; i++) {
		if (string) {
			if (/["']/.test(text[i]))
				string = false
		} else if (skipString && /["']/.test(text[i]))
			string = true
		else {
			let m = regex.exec(text.substr(i))
			if (m && m.groups)
				return [i, m.groups.end]

		}
	}
	return [text.length, ""]
}

export function toPlayerProps(name: TypE, vars: VariableBlock, props: Map<string, typeof Prop>): Map<string, typeof Prop>|null {
	if (name != TypE.player) return null
	let p: Map<string, typeof Prop> = new Map([...props])
	vars.forEach((v, k) => {
		p.set(k, VarProp.get(v.pointer, v.type))
	})
	return p
}

export function Elem(v: Value): Variable {
	return { const: false, isValue: Value.isValue, type: (v.type as ArrayType).type, toString: (g?: boolean) => "Current Array Element", pointer: 1, global: false, name: "Current Array Element", getArray: () => new ArrayInit, comments: [] }
}