import _ = require('underscore')
import { toCamelSep, splitWP, trueForAny, trueForEach, toTitle, findEnd, returnEnd, splitWPToken, findParan, Elem } from './helper'
import { VariableBlock, Comment, SynErr, Properties } from './typeUtil'
import { localRuleInd } from './build'
import { DiagnosticSeverity } from 'vscode-languageserver'

function toType(name: TypE, saveAble?: boolean, translation?: string, modifier?: string[] | string, def?: Value | string): [string, Type]
function toType(name: TypE, values: typeof Value[], saveAble?: boolean, translation?: string, modifier?: string[] | string, def?: Value | string): [string, Type]
function toType(name: TypE, values: typeof Value[], props: [string, typeof Prop][], saveAble?: boolean, translation?: string, modifier?: string[] | string, def?: Value | string): [string, Type]
function toType(name: TypE, values: typeof Value[], props: [string, typeof Prop][], arrayProps: [string, typeof Prop][], saveAble?: boolean, translation?: string, modifier?: string[] | string, def?: Value | string): [string, Type]
function toType(name: TypE, sa_va_va_va?: typeof Value[] | boolean, tr_sa_pr_pr?: string | boolean | [string, typeof Prop][], mod_tr_sa_ap?: string[] | string | boolean | [string, typeof Prop][], def_mod_tr_sa?: Value | string[] | string | boolean, _def_mod_tr?: Value | string[] | string, __def_mod?: Value | string[] | string, def?: Value | string): any {
	var props: [string, typeof Prop][] = []
	var arrayProps: [string, typeof Prop][] = []
	if (typeof sa_va_va_va == "boolean" || sa_va_va_va == undefined) {
		//toType(name,saveAble,translation,modifier)
		var saveAble = sa_va_va_va
		var values: typeof Value[] = []
		var translation = tr_sa_pr_pr as (string | undefined)
		var modifiers = mod_tr_sa_ap as (string | string[] | undefined)
		var defau = def_mod_tr_sa as Value | string | undefined
	} else {
		values = sa_va_va_va
		if (typeof tr_sa_pr_pr == "boolean" || tr_sa_pr_pr == undefined) {
			//toType(name, values, saveAble, translation, modifier)
			saveAble = tr_sa_pr_pr
			translation = mod_tr_sa_ap as (string | undefined)
			modifiers = def_mod_tr_sa as (string | string[] | undefined)
			defau = _def_mod_tr as Value | string | undefined
		} else {
			props = tr_sa_pr_pr as [string, typeof Prop][]
			if (typeof mod_tr_sa_ap == "boolean" || mod_tr_sa_ap == undefined) {
				//toType(name, values, props, saveAble, translation, modifiers)
				saveAble = mod_tr_sa_ap
				translation = def_mod_tr_sa as (string | undefined)
				modifiers = _def_mod_tr as (string | string[] | undefined)
				defau = __def_mod as Value | string | undefined
			} else {
				arrayProps = mod_tr_sa_ap as [string, typeof Prop][]
				saveAble = def_mod_tr_sa as boolean | undefined
				translation = _def_mod_tr as string | undefined
				modifiers = __def_mod as (string | string[] | undefined)
				defau = def
			}
		}
	}
	props.forEach((v) => {
		if (v[1].array)
			arrayProps.push(v)
	})
	return [name, new Type(name, values, props, arrayProps, saveAble, translation, modifiers ? [...modifiers] : undefined, defau)]
}
// | [string, string | ((value: Value | Value[], global?: boolean) => string), TypE | string] | [string, string | ((value: Value | Value[], global?: boolean) => string), TypE | string, (string | TypE | ((value: Value, text: string, global: VariableBlock, local: VariableBlock) => Value | null))[]]
//function toProp(name: string, translation: string | ((value: Value | Value[], global?: boolean) => string) | null | (string | ((value: Value | Value[], global?: boolean) => string) | null)[], type: Type | TypE | string): [string, typeof Prop]
//function toProp(name: string, translation: string | ((value: Value | Value[], global?: boolean) => string) | null | (string | ((value: Value | Value[], global?: boolean) => string) | null)[], type: Type | TypE | string, parameters: (string | Type | ((value: Value, text: string, global: VariableBlock, local: VariableBlock) => Value | null))[]): [string, typeof Prop]
function toProp(name: string,
	translation: string | ((value: Value | Value[], global?: boolean, indent?: string) => string) | null | (string | ((value: Value | Value[], global?: boolean, indent?: string) => string) | null)[],
	type: Type | TypE | string | (Type | TypE | string)[] = TypE.void,
	parameters: (string | Type | ((value: Value, text: string, global: VariableBlock, local: VariableBlock) => Value | null) | (string | Type | ((value: Value, text: string, global: VariableBlock, local: VariableBlock) => Value | null))[])[] = [],
	modifiers?: string | string[], lines = 1,
	optReturn = "", retType = TypE.undefined): [string, typeof Prop] {
	modifiers = modifiers ? [...modifiers] : undefined
	return [name, class extends Prop {
		getter = translation instanceof Array ? translation[0] || null : translation
		comments = [];
		setter = translation instanceof Array ? translation[1] || null : null
		modifier = translation instanceof Array ? translation[2] || null : null
		static access: PropType = (translation ? (translation instanceof Array ? (translation[0] ? PropType.get : 0) | (translation[1] ? PropType.set : 0) | (translation[2] ? PropType.mod : 0) : PropType.get) : 0)
		static type = type;
		static retType = retType;
		static optReturn = optReturn.length ? optReturn : null;
		static params = parameters
		lines = lines
		static modifiers = modifiers as string[] | undefined
		constructor(comments?: Comment[], value?: any) {
			super(comments, value)
		}
	}]
}

function arProp(name: string,
	translation: string | ((value: Value | Value[], global?: boolean, indent?: string) => string) | null | (string | ((value: Value | Value[], global?: boolean, indent?: string) => string) | null)[],
	type: Type | TypE | string | (Type | TypE | string)[] = TypE.void,
	parameters: (string | Type | ((value: Value, text: string, global: VariableBlock, local: VariableBlock) => Value | null) | (string | Type | ((value: Value, text: string, global: VariableBlock, local: VariableBlock) => Value | null))[])[] = [],
	modifiers?: string | string[], lines = 1,
	optReturn = "", retType = TypE.void): [string, typeof Prop] {
	let p = toProp(name, translation, type, parameters, modifiers, lines, optReturn, retType)
	p[1].array = true
	return p
}

export enum PropType {
	null = 0,
	set = 2 ** 0,
	get = 2 ** 1,
	mod = 2 ** 2,
	sg = set | get,
	sm = set | mod,
	gm = get | mod,
	sgm = set | get | mod
}

export enum TypE {
	color = "Color",
	button = "Button",
	status = "Status",
	teamConst = "TeamConst",
	playerConst = "PlayerConst",
	shortVisualEffect = "ShortVisualEffect",
	shortAudibleEffect = "ShortAudibleEffect",
	longVisualEffect = "LongVisualEffect",
	longAudibleEffect = "LongAudibleEffect",
	string = "String",
	emote = "Emote",
	voiceLine = "Voice Line",
	communicate = "Communicate",
	icon = "Icon",
	space = "Space",
	hudLocation = "HUDLocation",
	hudText = "HUDText",
	hero = "Hero",
	player = "Player",
	bool = "Boolean",
	number = "Number",
	vector = "Vector",
	team = "Team",
	undefined = "Undefined",
	array = "Array",
	abilities = "Abilities",
	ability = "Ability",
	game = "Game",
	filter = "Filter",
	world = "World",
	void = "Void",
	vectory = "Vectory",
	playery = "Playery",
	null = "Null",
	side = "side",
	damageModification = "damageModification"
}

export interface Value {
	comments: Comment[]
	value?: any
	toString(global?: boolean, indent?: string, stack?: string[]): string
	const: boolean
}

export class Value implements Value {
	const = false
	static isValue = Math.random()
	isValue?= Value.isValue
	static instance(obj: any) {
		if (obj instanceof Value || obj instanceof Variable || (obj.isValue == Value.isValue))
			return true
		else return false
	}
	static typE = TypE.undefined
	static parseables: (typeof Value | typeof Variable)[]
	get type(): Type {
		return this.t || Type.get((<typeof Value>this.constructor).typE)
	}
	protected t?: Type
	getArray(): ArrayInit[] | ArrayInit {
		return new ArrayInit
	}
	constructor(comments?: Comment[], v?: any) {
		this.comments = comments || []
	}
	static parse(texti: string | null | undefined, global: VariableBlock, local?: VariableBlock, type?: Type | TypE | (Type | TypE)[]): Value | null {
		if (texti)
			var text = texti
		else
			return null
		text = text.replace(/(^[\s\n]*|[\s\n]*$)/g, "").replace(/\n/g, " ")

		let end
		do {
			end = findParan(text, "()")
			if (end == text.length - 1 && end > 0)
				text = text.substring(1, end)
			else
				break
		} while (true)
		if (text == "" || /^(global|local)\b/.test(text) || (!/^(["']|new)/.test(text) && /\w[\n\s]+\w/.test(text))) return null
		if (type != undefined) {
			if (type == TypE.vectory) type = [TypE.player, TypE.vectory]
			if (type == TypE.playery) type = [TypE.player, new ArrayType(TypE.player)]
			if (type instanceof Array) {
				let ret = null
				_.find(type, (v) => {
					ret = Value.parse(text, global, local, v)
					return ret
				})
				return ret
			}
			var t = type
			if (typeof type == "string")
				type = Type.get(type)
			var a = null
			a = ConstValue.parse(text)
			if (!a && type.saveAble)
				a = Variable.parse(text, global, local, type)
			if (!a)
				a = Prop.parse(text, global, local, type)
			if (!a)
				a = ArrayConst.parse(text, global, local, type)
			if (!a)
				a = ArrayAccess.parse(text, global, local, type)
			if (a && a.type == type) return a
			for (let index = 0; index < type.values.length && !a; index++) {
				a = type.values[index].parse(text, global, local)
			}
			if (type == Type.as(TypE.bool) && !a) {
				a = Value.parse(text, global, local, Type.boolables)
			}
			return a
		}

		var ret: Value | null = null

		this.parseables.find((v) => { if (v.parse != Value.parse) ret = v.parse(text, global, local); return ret })
		return ret
		// Array.from(Type.types.values()).find((v) => {
		// 	for (let i = 0; i < v.values.length; i++) {
		// 		if (v.values[i].parse != Value.parse)
		// 			ret = v.values[i].parse(text, global, local)
		// 		return ret
		// 	}
		// 	return false
		// })
		// if (!ret)
		// 	[ConstValue, Variable, Prop].find((v) => {
		// 		ret = v.parse(text, global, local)
		// 		return ret
		// 	})
		// return ret
		// return BoolConst.parse(text) || BoolOp.parse(text, global, local) || Comp.parse(text, global, local) || PlayerConst.parse(text) || TeamConst.parse(text) || NumConst.parse(text) || NumOp.parse(text, global, local)

	}
}

export interface Func extends Value {
	params: Type[]
}

export class Func {
	static typE = TypE.undefined

}

export class Variable implements Value {
	const = false
	isValue = Value.isValue
	type: Type
	comments: Comment[] = [];
	pointer: string | number
	global = true
	name = "a"
	static playerVars = "A"
	getArray = () => new ArrayInit
	constructor(obj: { type?: TypE | Type, pointer: string | number, name: string, local?: boolean })
	constructor(type: TypE | Type, pointer: string | number, name: string, local: boolean)
	constructor(type: any, pointer?: any, name?: any, local?: any) {
		if (type.pointer != undefined) {
			this.type = Type.as(type.type)
			this.pointer = type.pointer || 0
			this.name = type.name
			this.global = !(type.local || false)
		} else {
			this.type = Type.as(type)
			this.pointer = pointer || 0
			this.name = name
			this.global = !(local || false)
		}
	}

	static parse(text: string, global: VariableBlock, local?: VariableBlock, type?: Type | TypE): Variable | null {
		var m = /^[\s\n]*(?<name>[\p{Alphabetic}_][\p{Alphabetic}_0-9]*)[\s\n]*$/u.exec(text)
		var v: Variable | undefined
		if (m && m.groups) {
			if (local)
				v = local.get(m.groups.name)
			v = v || global.get(m.groups.name)

			if (v && (!type || v.type.equals(type)))
				return v
		}
		return null
	}

	toString(global: boolean = true) {
		return "Value In Array(" + (global || this.global ? "Global" : "Player") + " Variable(" + (this.global ? "A), " + this.pointer : "B), " + (this.pointer as number + localRuleInd)) + ")"
	}
}
export class AbstractValue extends Value {
	value: any
	array: boolean = false;
	comments: Comment[] = [];

	constructor(comments?: Comment[], v?: any) {
		super()
		this.comments = comments || []
		this.value = v
	}
	toString(global: boolean = true) {
		return this.value.toString(global)
	}
}

export class Prop extends AbstractValue {
	lines = 1
	ret = true;
	static array = false;
	static type: TypE | string | Type | (Type | TypE | string)[]
	static retType: TypE | string | Type | (Type | TypE | string)[]
	static optReturn: string | null
	set const(v) { }
	get const() {
		return this.value instanceof Array ? this.value.every((v) => v.const) : this.value.const
	}
	getArray() {
		return this.value instanceof Array ? this.value[0].getArray() : this.value.getArray()
	}
	public get types(): Type[] {
		let t = (<typeof Prop>this.constructor).type
		let array = (t instanceof Array) ? t : [t]
		let ts: Type[] = []
		array.forEach((t) => {

			if (Type.instance(t))
				ts.push(t as Type)
			if (_.values(TypE).includes(<TypE>t))
				ts.push(Type.get((<typeof Prop>this.constructor).type as TypE))
			var v = this.value instanceof Array ? this.value[0] : this.value
			while (/-t/.test(t as string) && v.value) {
				t = (t as string).substring(1)
				v = v.value instanceof Array ? this.value[0] : this.value
			}
			if (v && v.type)
				ts.push(v.type)
			return Type.get(TypE.undefined)
			//	throw "help" 
		})
		return ts
	}
	public get type(): Type {
		let t = (<typeof Prop>this.constructor).type
		if (Type.instance(t))
			return t as Type
		if (_.values(TypE).includes(<TypE>t))
			return Type.get((<typeof Prop>this.constructor).type as TypE)
		var v = this.value instanceof Array ? this.value[0] : this.value
		while (/-t/.test(t as string) && v.value) {
			t = (t as string).substring(1)
			v = v.value instanceof Array ? this.value[0] : this.value
		}
		if (v && v.type)
			return v.type
		//	throw "help"
		return Type.get(TypE.undefined)

	}
	public get rettype(): Type {
		let t = (<typeof Prop>this.constructor).retType
		if (Type.instance(t))
			return t as Type
		if (_.values(TypE).includes(<TypE>t))
			return Type.get(t as TypE)
		var v = this.value instanceof Array ? this.value[0] : this.value
		while (/-t/.test(t as string) && v.value) {
			t = (t as string).substring(1)
			v = v.value instanceof Array ? this.value[0] : this.value
		}
		if (v && v.type)
			return v.type
		//	throw "help"
		return Type.get(TypE.undefined)

	}
	static access = PropType.get
	static modifiers: string[] | undefined = undefined

	public get modifiers(): string[] {
		return (<typeof Prop>this.constructor).modifiers || this.type.modifiers
	}

	getter: string | ((value: Value, global?: boolean, indent?: string) => string) | undefined | null
	setter: string | ((value: Value, global?: boolean, indent?: string) => string) | undefined | null
	modifier: string | ((value: Value, global?: boolean, indent?: string) => string) | undefined | null
	static params: (string | Type | ((value: Value, text: string, global: VariableBlock, local: VariableBlock) => Value | null) | (string | Type | ((value: Value, text: string, global: VariableBlock, local: VariableBlock) => Value | null))[])[] = []
	constructor(comments?: Comment[], v?: any) {
		super()
		this.comments = comments || []
		this.value = v
	}

	static parse(text: string, global: VariableBlock, local?: VariableBlock, type: Type | TypE = TypE.undefined, access = PropType.get): Prop | null {
		text = text.replace(/[\s\n]*/g, "")
		let test = splitWP(text, /[",+\-*/\^&|]/).length == 1
		var arr = splitWP(text, /\./)
		arr = test ? arr : []
		type = Type.as(type)
		var val = null
		if (arr.length >= 2)
			val = Value.parse(arr.slice(0, arr.length - 1).join("."), global, local)
		else if (arr.length == 1) {
			val = new (class extends ConstValue { static typE = TypE.void })
			arr[1] = arr[0]
		}
		if (val && val.type) {
			var prop = val.type.get(arr[arr.length - 1].split("(", 1)[0])
			if (prop && (access & prop.access)) {
				if (prop.params.length > 0) {
					if (arr[arr.length - 1].endsWith(")") && arr[arr.length - 1].includes("(")) {
						let params = (arr[arr.length - 1].match(/[^]*?\(([^]*?)\)$/) as RegExpMatchArray)[1]
						let arr2 = splitWP(params, /,/)
						let props: (Value | null)[] = []
						let ind = 0
						for (let index = 0; index < prop.params.length; index++) {
							const v: (string | Type | ((value: Value, text: string, global: VariableBlock, local: VariableBlock) => Value | null) | (string | Type | ((value: Value, text: string, global: VariableBlock, local: VariableBlock) => Value | null))[]) = prop.params[index]
							let l: Value | null = null
							if (v instanceof Array) {
								for (let i = 0; i < v.length && !l; i++) {
									const e: any = v[i]
									if (typeof e == "function") {
										l = e(val, arr2[ind] || "", global, local as VariableBlock)
										if (l) ind++
									} else
										if (Type.instance(e) || Object.values(TypE).includes(<TypE>e)) {
											l = Value.parse(arr2[ind] || "", global, local, Type.as(e as TypE | Type))
											if (!l)
												if (typeof Type.as(e as TypE | Type).defau == "string")
													l = Value.parse(Type.as(e as TypE | Type).defau as string, global, local, Type.as(e as TypE | Type))
												else
													l = Type.as(e as TypE | Type).defau as Value | null
											if (l) ind++
										}
										else {
											switch (e) {
												case "-[]":
													if (val.type instanceof ArrayType)
														l = Value.parse(arr2[ind] || "", global, local, (<ArrayType>(val).type).type)
													if (l) ind++
													break
												case "v":
													l = val
													break
											}
										}
								}
							} else if (typeof v == "function") {
								l = v(val, arr2[ind++] || "", global, local as VariableBlock)
							} else
								if (Type.instance(v) || Object.values(TypE).includes(<TypE>v)) {
									l = Value.parse(arr2[ind++] || "", global, local, Type.as(v as TypE | Type))
									if (!l)
										if (typeof Type.as(v as TypE | Type).defau == "string")
											l = Value.parse(Type.as(v as TypE | Type).defau as string, global, local, Type.as(v as TypE | Type))
										else
											l = Type.as(v as TypE | Type).defau as Value | null
								}
								else {
									switch (v) {
										case "-[]":
											if (val.type instanceof ArrayType)
												l = Value.parse(arr2[ind++] || "", global, local, (<ArrayType>(val).type).type)
											break
										case "v":
											l = val
											break
									}
								}
							if (!l)
								return null
							props.push(l)
						}

						if (props.length == prop.params.length)
							return new prop([], props)

					}
					return null
				}
				let value = new prop([], val)
				if (value.rettype == type)
					value.ret = true
				if (type == Type.undefined || value.type == type || value.rettype == type)
					return value
			}
		}

		return null
	}

	toString(global: boolean = true, indent = "", stack: string[] = [], set: Value | null | boolean = null, mod = "") {
		let n = set ? (mod ? this.modifier || "" : this.setter || "") : this.getter
		if (typeof n == "function")
			var name = n(this.value, global, indent)
		else
			name = n || ""
		return name.replace(/\$p\$/g, this.value instanceof Array ? _.map(this.value as (Value | null)[], (v) => Value.instance(v) ? (v as Value).toString(global) : "NULL").join(", ") : Value.instance(this.value) ? (this.value as Value).toString(global) : "NULL")
			.replace(/\$p(\d+)\$/g, (v, a) => this.value[parseInt(a)] ? this.value[parseInt(a)].toString(global) : "NULL")
			.replace(/(?:\$)([^]*?)(?:\$)/g, (a, b) => {
				//if (b == "v") return this.value.toString(global)
				//if (b == "p") return _.map(this.value as (Value | null)[], (v) => v ? v.toString(global) : "NULL").join(", ")
				if (b == "s") return set ? set.toString(global) : ""
				if (b == "op") return mod
				let list = b.split("|")
				// TODO: Dynamic Boolean
				if (list.length == 3) {
					let i = parseInt(list[0].substr(1))
					if (this.value[i]) {
						return this.value[i].value ? list[1] : list[2]
					}
				}
				if (list.length == 5) {
					let listi = list[0].split(",")
					let i0 = parseInt(listi[0].substr(1))
					let i1 = parseInt(listi[1].substr(1))
					if (this.value[i0] && this.value[i1]) {
						return this.value[i0].value ? this.value[i1].value ? list[1] : list[2] : this.value[i1].value ? list[3] : list[4]
					}
				}
				var v = this.value
				while (/-v/.test(b)) {
					if (!v.value)
						return v.toString(global)
					v = v.value
					b = b.substr(1)
				}
				return v.toString(global)
			})

	}
}

export class VarProp extends Prop {
	static get(variable?: Variable): typeof Prop | undefined {
		return variable ? class extends VarProp { index = (variable as Variable).pointer; static type = (variable as Variable).type } : undefined
	}
	index: number | string = 0
	static access = PropType.sgm
	get getter() { return "Value In Array(Player Variable($v$), " + Variable.playerVars + "), " + this.index + ")" }
	get setter() { return "Set Player Variable At Index($v$, " + Variable.playerVars + ", " + this.index + ", $s$)" }
	get modifier() { return "Modify Player Variable At Index($v$, " + Variable.playerVars + ", " + this.index + ", $op$, $s$)" }

}

export class Class extends AbstractValue {

	value: (string | boolean | Value)[] = []

	static types: ((TypE | Type)[] | TypE | Type)[] = []
	static defaults: (string | boolean)[] = []
	s = ""

	static classes: Map<string, typeof Class[]> = new Map();


	constructor(comments: Comment[], value: (string | boolean | Value)[]) {
		super(comments, value)
	}

	static add(name: string, value: [string | (() => string), ((TypE | Type)[] | TypE | Type)[]], defaults: (string | boolean)[] = []) {

		let types = value[1]
		if (defaults.length && defaults.length != types.length)
			throw "Defaults of " + name + "has wrong length: " + defaults.length + " != " + types.length
		let s = value[0]

		let class_ = class extends Class {
			static types = types
			static defaults = defaults
			s = (typeof s == "function" ? "" : s)
		}
		if (typeof s == "function")
			class_.toString = s
		if (this.classes.has(name + types.length))
			(this.classes.get(name + types.length) as any).push(class_)
		else
			this.classes.set(name + types.length, [class_])
	}

	static parse(text: string, global: VariableBlock, local?: VariableBlock): Value | null {
		var m = /^new\s*(?<name>[\p{Alphabetic}_][\p{Alphabetic}_0-9]*)[\s]*(\((?<params>[^]*?)\))?$/u.exec(text)
		if (m && m.groups) {
			let name = m.groups.name
			var paramS = splitWP(m.groups.params, /,/)
			let keys = _.filter(
				Array.from(this.classes.keys()),
				(key) => Number.parseInt(key.substring(name.length)) > paramS.length
					&& key.startsWith(name))
			let c: typeof Class[] | undefined = this.classes.get(m.groups.name + paramS.length) ||
				_.flatten(
					_.map(keys,
						(key) => _.filter(this.classes.get(key) as typeof Class[],
							(entry) => entry.defaults.length > 0)))
			if (c) {
				for (let index = 0; index < c.length; index++) {
					const element = c[index]

					let types = element.types
					let params: (Value | null | string | boolean)[] = _.map(types, (t, i) => Value.parse(paramS[i], global, local, t))
					if (element.defaults.length)
						params.forEach((e, i) => params[i] = e ? e : element.defaults[i])
					if (!params.includes(null)) {
						var ret = new element([], params as (string | boolean | Value)[])
						ret.value = params as Value[]
						return ret
					}
				}
			}

		}
		return null
	}


	toString(global = true): string {
		return this.s.replace(/\$p\$/g, _.map(this.value, (v) => v.toString(global)).join(", ")).replace(/\$p(\d+)\$/g, (v, a) => this.value[parseInt(a)].toString(global)).replace(/(?:\$)([^]*?)(?:\$)/g, (a, b) => {
			//if (b == "v") return this.value.toString(global)
			//if (b == "p") return _.map(this.value as (Value | null)[], (v) => v ? v.toString(global) : "NULL").join(", ")
			let list = b.split("|")
			// TODO Dynamic Boolean
			if (list.length == 3) {
				let elem = this.value[parseInt(list[0].substr(1))]
				switch (typeof elem) {
					case "object":
						elem = elem.value
					case "boolean":
						return elem ? list[1] : list[2]
					case "string":
						return elem
				}
			}
			if (list.length == 5) {
				let listi = list[0].split(",")
				let elem0 = this.value[parseInt(listi[0].substr(1))]
				let elem1 = this.value[parseInt(listi[1].substr(1))]
				if (typeof elem0 == "object")
					elem0 = elem0.value
				if (typeof elem1 == "object")
					elem1 = elem1.value
				if (typeof elem0 == "boolean" && typeof elem1 == "boolean") {
					return elem0 ? elem1 ? list[1] : list[2] : elem1 ? list[3] : list[4]
				}
				throw "This is an Error, elem0 and elem1 should not be strings: " + elem0 + ", " + elem1
			}
			throw "This is an Error."
		})
	}
}

export class StringConst extends AbstractValue {

	static typE = TypE.string

	static normal = ["", "----------", "!", "!!", "!!!", "*", "...", "?", "??", "???", "Abilities", "Ability", "Alert", "Alive", "Allies", "Ally", "Ammunition", "Angle", "Attack", "Attacked", "Attacking", "Attempt", "Attempts", "Average", "Avoid", "Avoided", "Avoiding", "Backward", "Bad", "Ban", "Banned", "Banning", "Best", "Better", "Bid", "Bids", "Block", "Blocked", "Blocking", "Blue", "Bonus", "Bonuses", "Boss", "Bosses", "Bought", "Build", "Building", "Built", "Burn", "Burning", "Burnt", "Buy", "Buying", "Capture", "Captured", "Capturing", "Caution", "Center", "Charisma", "Chase", "Chased", "Chasing", "Checkpoint", "Checkpoints", "Cloud", "Clouds", "Club", "Clubs", "Combo", "Condition", "Congratulations", "Connect", "Connected", "Connecting", "Constitution", "Cooldown", "Cooldowns", "Corrupt", "Corrupted", "Corrupting", "Credit", "Credits", "Critical", "Crouch", "Crouched", "Crouching", "Current", "Damage", "Damaged", "Damaging", "Danger", "Dead", "Deal", "Dealing", "Dealt", "Deck", "Decks", "Defeat", "Defend", "Defended", "Defending", "Defence", "Deliver", "Delivered", "Delivering", "Depth", "Destabilize", "Destabilized", "Destabilizing", "Destroy", "Destroyed", "Destroying", "Detect", "Detected", "Detecting", "Dexterity", "Diamond", "Diamonds", "Die", "Discard", "Discarded", "Discarding", "Disconnect", "Disconnected", "Disconnecting", "Distance", "Distances", "Dodge", "Dodged", "Dodging", "Dome", "Domes", "Down", "Download", "Downloaded", "Downloading", "Draw", "Drawing", "Drawn", "Drop", "Dropped", "Dropping", "Dying", "East", "Eliminate", "Eliminated", "Eliminating", "Elimination", "Eliminations", "Enemies", "Enemy", "Entrance", "Escort", "Escorted", "Escorting", "Excellent", "Exit", "Experience", "Extreme", "Face", "Faces", "Facing", "Failed", "Failing", "Failure", "Fall", "Fallen", "Falling", "Far", "Fast", "Faster", "Fastest", "Fault", "Faults", "Final", "Find", "Finding", "Finish", "Finished", "Finishing", "Flown", "Fly", "Flying", "Fold", "Folded", "Folding", "Form", "Forms", "Forward", "Found", "Freeze", "Freezing", "Frozen", "Game", "Games", "Gg", "Go", "Goal", "Goals", "Going", "Good", "Goodbye", "Green", "Guilty", "Hack", "Hacked", "Hacking", "Hand", "Hands", "Heal", "Healed", "Healer", "Healers", "Healing", "Heart", "Hearts", "Height", "Hello", "Help", "Here", "Hero", "Heroes", "Hidden", "Hide", "Hiding", "Hit", "Hitting", "Hmmm", "Hostage", "Hostages", "Huh", "Hunt", "Hunted", "Hunter", "Hunters", "Hunting", "Income", "Incoming", "Initial", "Innocent", "Inside", "Intelligence", "Interact", "Invisible", "Item", "Items", "Join", "Joined", "Joining", "Jump", "Jumping", "Kill", "Kills", "Killstreak", "Killstreak", "Killstreaks", "Leader", "Leaders", "Least", "Left", "Less", "Level", "Levels", "Life", "Limited", "Lives", "Load", "Loaded", "Loading", "Location", "Lock", "Locked", "Locking", "Loser", "Losers", "Loss", "Losses", "Max", "Mild", "Min", "Mission", "Missions", "Moderate", "Money", "Monster", "Monsters", "More", "Most", "Near", "Next", "No", "None", "Normal", "North", "Northeast", "Northwest", "Object", "Objective", "Objectives", "Objects", "Obtain", "Obtained", "Obtaining", "Off", "On", "Oof", "Oops", "Optimal", "Optimize", "Optimized", "Optimizing", "Outgoing", "Outside", "Over", "Overtime", "Participant", "Participants", "Payload", "Payloads", "Phase", "Phases", "Pick", "Picked", "Picking", "Pile", "Piles", "Play", "Played", "Player", "Players", "Playing", "Point", "Points", "Position", "Power", "Power-Up", "Power-Ups", "Price", "Projectile", "Projectiles", "Protect", "Protected", "Protecting", "Purified", "Purify", "Purifying", "Purple", "Raise", "Raised", "Raising", "Rank", "Reach", "Reached", "Reaching", "Ready", "Record", "Records", "Recover", "Recovered", "Recovering", "Red", "Remain", "Remaining", "Rescue", "Rescued", "Rescuing", "Resource", "Resources", "Resurrect", "Resurrected", "Resurrecting", "Reveal", "Revealed", "Revealing", "Right", "Round", "Rounds", "Run", "Running", "Safe", "Save", "Saved", "Saving", "Score", "Scores", "Secure", "Secured", "Securing", "Select", "Selected", "Selecting", "Sell", "Selling", "Sever", "Severe", "Severed", "Severing", "Shop", "Shops", "Shuffle", "Shuffled", "Sink", "Sinking", "Skip", "Skipped", "Skipping", "Sleep", "Sleeping", "Slept", "Slow", "Slower", "Slowest", "Sold", "Sorry", "South", "Southeast", "Southwest", "Spade", "Spades", "Sparkles", "Spawn", "Spawned", "Spawning", "Speed", "Speeds", "Sphere", "Spheres", "Stabilize", "Stabilized", "Stabilizing", "Stable", "Star", "Stars", "Start", "Started", "Starting", "Status", "Stay", "Stayed", "Staying", "Stop", "Stopped", "Stopping", "Strength", "Stun", "Stunned", "Stunning", "Suboptimal", "Success", "Sunk", "Superb", "Survive", "Survived", "Surviving", "Target", "Targets", "Team", "Teammate", "Teammates", "Teams", "Terrible", "Thanks", "Threat", "Threats", "Tiebreaker", "Time", "Times", "Total", "Trade", "Traded", "Trading", "Traitor", "Traitors", "Transfer", "Transferred", "Transferring", "Turret", "Turrets", "Ugh", "Under", "Unknown", "Unlimited", "Unlock", "Unlocked", "Unlocking", "Unsafe", "Unstable", "Up", "Upgrade", "Upgrades", "Upload", "Uploaded", "Uploading", "Victory", "Visible", "Vortex", "Vortices", "Wait", "Waiting", "Wall", "Walls", "Warning", "Welcome", "West", "White", "Wild", "Win", "Winner", "Winners", "Wins", "Wisdom", "Worse", "Worst", "Wow", "Yellow", "Yes", "You", "Zone", "Zones", "Ability 1", "Ability 2", "Challenge Accepted", "Come Here", "Control Point", "Control Points", "Games Lost", "Games Won", "Good Luck", "High Score", "High Scores", "I Tried", "In View", "Mission Aborted", "Mission Accomplished", "My Mistake", "New Record", "Nice Try", "Not Today", "Points Earned", "Points Lost", "Primary Fire", "Rank A", "Rank B", "Rank C", "Rank D", "Rank E", "Rank F", "Rank S", "Rounds Lost", "Rounds Won", "Secondary Fire", "Server Load", "Stay Away", "Sudden Death", "Thank You", "Try Again", "Ultimate Ability", "Well Played", "You Lose", "I Give Up", "New High Score", "Out Of View", "Server Load Average", "Server Load Peak", "That Was Awesome", "Use Ability 1", "Use Ability 2", "Use Ultimate Ability"]
	static combined_normal = ["Current Allies", "Current Ally", "Current Attempt", "Current Checkpoint", "Current Enemies", "Current Enemy", "Current Form", "Current Game", "Current Hero", "Current Heroes", "Current Hostage", "Current Hostages", "Current Level", "Current Mission", "Current Object", "Current Objective", "Current Objects", "Current Phase", "Current Player", "Current Players", "Current Round", "Current Target", "Current Targets", "Current Upgrade", "Final Allies", "Final Ally", "Final Attempt", "Final Checkpoint", "Final Enemies", "Final Enemy", "Final Form", "Final Game", "Final Hero", "Final Heroes", "Final Hostage", "Final Hostages", "Final Item", "Final Level", "Final Mission", "Final Object", "Final Objective", "Final Objects", "Final Phase", "Final Player", "Final Players", "Final Round", "Final Target", "Final Targets", "Final Time", "Final Upgrade", "Initial Allies", "Initial Ally", "Initial Attempt", "Initial Checkpoint", "Initial Enemies", "Initial Enemy", "Initial Form", "Initial Game", "Initial Hero", "Initial Heroes", "Initial Hostage", "Initial Level", "Initial Mission", "Initial Object", "Initial Objective", "Initial Objects", "Initial Phase", "Initial Player", "Initial Players", "Initial Round", "Initial Target", "Initial Targets", "Initial Upgrade", "Level Down", "Level Up", "Mission Failed", "Next Allies", "Next Ally", "Next Attempt", "Next Checkpoint", "Next Enemies", "Next Enemy", "Next Form", "Next Game", "Next Hero", "Next Heroes", "Next Hostage", "Next Hostages", "Next Level", "Next Mission", "Next Object", "Next Objective", "Next Objects", "Next Phase", "Next Player", "Next Players", "Next Round", "Next Target", "Next Targets", "Next Upgrade", "No Thanks", "Threat Level", "Threat Levels", "You Win"]
	static maxSpace = Math.max(..._.map(StringConst.normal, (v) => v.split(" ").length), ..._.map(StringConst.combined_normal, (v) => v.split(" ").length))
	static surrounding = ["({0})", "¡{0}!", "¿{0}?"]
	static brackets = _.map(StringConst.surrounding, (v) => v[0] + v[v.length - 1])
	static starting = ["-> {0}", "#{0}", "<- {0}", "<-> {0}", "Round {0}"]
	static ending = ["{0} ->", "{0} <-", "{0} <->", "{0} M", "{0} M/S", "{0} Sec", "{0}!", "{0}!!", "{0}!!!", "{0}%", "{0}:", "{0}?", "{0}??", "{0}???"]
	static combining2 = ["{0} - {1}", "{0} -> {1}", "{0} != {1}", "{0} * {1}", "{0} / {1}", "{0} {1}", "{0} + {1}", "{0} <- {1}", "{0} <-> {1}", "{0} < {1}", "{0} <= {1}", "{0} = {1}", "{0} == {1}", "{0} > {1}", "{0} >= {1}", "{0} And {1}", "{0} Vs {1}", "{0}, {1}", "{0}: {1}", "{0}:{1}"]
	static combining3 = ["{0} - {1} - {2}", "{0} : {1} : {2}", "{0} {1} {2}", "{0}, {1}, And {2}", "{0}: {1} And {2}"]
	static combining2RegExp = new RegExp(_.map((StringConst.combining2), v => v.substring(3, v.length - 3).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|") + _.map((StringConst.combining2), v => v.substring(3, v.length - 3).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/(?<=\S)\s|\s(?=\S)/g, "")).join("|"), "i")
	static parse(text: string, global: VariableBlock, local?: VariableBlock): Value | null {
		if (/^["'][^"']*["']$/.test(text)) {
			text = text.replace(/["']/g, "")
			return this.keepParsing(text, global, local)
		}
		return null
	}

	static keepParsing(text: string, global: VariableBlock, local?: VariableBlock, rec = true): Value | null {
		let text_ = toTitle(text)
		//standard
		if (this.normal.includes(text_) || this.combined_normal.includes(text_))
			return new StringConst([], text)
		var ret: (null | Value) = null
		this.surrounding.forEach((v) => { text = text.replace("\\" + v[0], v[v.length - 1]).replace("\\" + v[v.length - 1], v[0]) })
		//parse surrounding
		if (!ret)
			_.find(this.surrounding, (v) => {
				var a = null
				if ((text.startsWith(v[0])) && text.endsWith(v[v.length - 1]))
					a = this.keepParsing(text.substring(1, text.length - 1), global, local)
				if (a)
					ret = new StringConst([], [v, a])
				return ret
			})
		//parse starting
		if (!ret)
			_.find(this.starting, (v) => {
				var a = null
				let v_ = v.replace(/\s/g, "")
				if ((text_.startsWith(v.substring(0, v.length - 3))))
					a = this.keepParsing(text.substring(v.length - 3, text.length), global, local)
				else if ((text_.startsWith(v_.substring(0, v_.length - 3))))
					a = this.keepParsing(text.substring(v_.length - 3, text.length), global, local)
				if (a)
					ret = new StringConst([], [v, a])
				return ret
			})
		//parse ending
		if (!ret)
			_.find(this.ending, (v) => {
				var a = null
				let v_ = v.replace(/\s/g, "")
				if ((text_.endsWith(v.substring(3))))
					a = this.keepParsing(text.substring(0, text.length - (v.length - 3)), global, local)
				else if ((text_.endsWith(v_.substring(3))))
					a = this.keepParsing(text.substring(0, text.length - (v_.length - 3)), global, local)
				if (a)
					ret = new StringConst([], [v, a])
				return ret
			})

		//parse values
		if (!ret && text.startsWith("{") && text.endsWith("}")) {
			return Value.parse(text.substring(1, text.length - 1), global, local) || new StringConst([], "")
		}
		//parse starting with combining2
		if (!ret)
			_.find(this.combining2, (v) => {
				var a = null
				let v_ = v.replace(/\s/g, "")
				if ((text_.startsWith(v.substring(3, v.length - 3))))
					a = this.keepParsing(text.substring(v.length - 6, text.length), global, local)
				else if (v_.length > 6 && text_.startsWith(v_.substring(3, v_.length - 3)))
					a = this.keepParsing(text.substring(v_.length - 6, text.length), global, local)
				if (a)
					ret = new StringConst([], [v, a])
				return ret

			})
		//parse ending with combining2
		if (!ret)
			_.find(this.combining2, (v) => {
				var a = null
				let v_ = v.replace(/\s/g, "")
				if ((text_.endsWith(v.substring(3, v.length - 3))))
					a = this.keepParsing(text.substring(0, text.length - (v.length - 6)), global, local)
				else if (v_.length > 6 && (text_.endsWith(v_.substring(3, v_.length - 3))))
					a = this.keepParsing(text.substring(0, text.length - (v_.length - 6)), global, local)
				if (a)
					ret = new StringConst([], [v, a])
				return ret
			})

		if (!ret && rec) {
			let a = splitWPToken(text, this.combining2RegExp, undefined, ...this.brackets)
			if (a.length > 1) {
				let b: (Value | string)[] = []
				let jumpbackI = []
				let jumpbackJ = []
				for (let i = 0; i < a.length; i += 2) {
					let t
					for (let j = 0; !t; j += 2) {
						if (j >= this.maxSpace * 2 || i + j == a.length) {
							i = jumpbackI.pop() as number
							j = jumpbackJ.pop() as number
						}
						t = this.keepParsing(a.slice(i, i + j + 1).join(""), global, local, false)
						if (t) {
							if (i > 0)
								b.push(a[i - 1])
							b.push(t)
							jumpbackI.push(i)
							jumpbackJ.push(j)
							i += j
							break
						} else {
							if (i + j + 1 > a.length)
								break
						}
					}
				}
				ret = typeof b[b.length - 1] == "string" ? new StringConst([], b[b.length - 1]) : b[b.length - 1] as Value
				for (let i = b.length - 3; i >= 0; i -= 2) {
					let a = _.find(this.combining2, (v) => v.substring(3, v.length - 3).replace(" ", "").toLowerCase() == (b[i + 1] as string).toLowerCase().replace(" ", ""))
					ret = new StringConst([], [a, b[i], ret])
				}
			}
		}

		//if text is not a string, but a value, return the value
		return ret || Value.parse(text, global, local)
	}

	toString(global = true): string {
		if (!this.value)
			return 'String("", Null, Null, Null)'
		if (typeof this.value == "string")
			return 'String("' + this.value + '", Null, Null, Null)'
		if (this.value.length == 2)
			return 'String("' + this.value[0] + '", ' + this.value[1].toString(global) + ', Null, Null)'
		if (this.value.length == 3)
			return 'String("' + this.value[0] + '", ' + this.value[1].toString(global) + ', ' + this.value[2].toString(global) + ', Null)'
		return 'String("' + this.value[0] + '", ' + this.value[1].toString(global) + ', ' + this.value[2].toString(global) + ', ' + this.value[2].toString(global) + ')'
	}
}

//#region Number

export class Num extends AbstractValue {
	static typE = TypE.number
}

export class NumConst extends Num {
	const = true
	value: number = 0
	constructor(comments?: Comment[], v: number = 0) {
		super(comments)
		this.value = v
	}
	toString(global: boolean = true) {
		return "" + this.value
	}
	static parse(text: string, ...args: any[]): Value | null {
		var m = /(?<pi>pi|π)$/i.exec(text)
		if (m && m.groups)
			if (m.groups.pi)
				return new NumConst([], Math.PI)
		if (/^[+-]?([0-9]+(\.[0-9]*)?|\.[0-9]+)$/.test(text))
			return new NumConst([], Number.parseFloat(text))
		return null
	}
}

enum numOp {
	plus = "Add", minus = "Subtract", times = "Multiply", divide = "Divide", pow = "Raise to Power", mod = "Modulo",
	scalar = "Add(Multiply(X Component Of($p0$), X Component Of($p1$)), Add(Multiply(Y Component Of($p0$), Y Component Of($p1$)), Multiply(Z Component Of($p0$), Z Component Of($p1$))))"
}

export class NumOp extends Num {
	operator: numOp
	values: Value[]

	set const(v) { }
	get const() {
		return this.values.every((v) => v.const)
	}
	getArray() {
		return _.flatten(_.map(this.values, (v) => v.getArray()))
	}

	constructor(comments?: Comment[], values?: Value[], operator?: numOp)
	constructor(operator: numOp, values: Value[], comments?: Comment[])
	constructor(co_op: any, va: Value[] = [new NumConst, new NumConst], op_co: any) {
		if (co_op instanceof Array || co_op == undefined) {
			super(co_op)
			this.operator = op_co
			this.values = va
		}
		else {
			super(op_co)
			this.operator = co_op
			this.values = va
		}
	}
	static parse(text: string, global: VariableBlock, local?: VariableBlock): Value | null {
		text = text.replace(/[\s\n]*/g, "")
		var split = splitWP(text, /\+/, 2)
		if (split.length > 1) {
			let a = Value.parse(split[0], global, local, TypE.number)
			let b = Value.parse(split[1], global, local, TypE.number)
			if (a == null || b == null) return null
			else
				return new NumOp(numOp.plus, [a, b])
		}
		var split = splitWP(text, /-/)
		if (split.length > 1) {
			split[0] = split.slice(0, split.length - 1).join("-")
			split[1] = split[split.length - 1]
			let a = split[0] == "" ? new NumConst : Value.parse(split[0], global, local, TypE.number)
			let b = Value.parse(split[1], global, local, TypE.number)
			if (a == null || b == null) return null
			else
				return new NumOp(numOp.minus, [a, b])
		}
		var split = splitWP(text, /%/)
		if (split.length > 1) {
			let a = Value.parse(split[0], global, local, TypE.number)
			let b = Value.parse(split[1], global, local, TypE.number)
			if (a == null || b == null) return null
			else
				return new NumOp(numOp.mod, [a, b])
		}
		var split = splitWP(text, /\*/, 2)
		if (split.length > 1) {
			let a = Value.parse(split[0], global, local, TypE.number)
			let b = Value.parse(split[1], global, local, TypE.number)
			if (a == null || b == null) return null
			else
				return new NumOp(numOp.times, [a, b])
		}
		var split = splitWP(text, /\//)
		if (split.length > 1) {
			split[0] = split.slice(0, split.length - 1).join("/")
			split[1] = split[split.length - 1]
			let a = Value.parse(split[0], global, local, TypE.number)
			let b = Value.parse(split[1], global, local, TypE.number)
			if (a == null || b == null) return null
			else
				return new NumOp(numOp.divide, [a, b])
		}
		var split = splitWP(text, /\^/, 2)
		if (split.length > 1) {
			let a = Value.parse(split[0], global, local, TypE.number)
			let b = Value.parse(split[1], global, local, TypE.number)
			if (a == null || b == null) return null
			else
				return new NumOp(numOp.pow, [a, b])
		}

		var split = splitWP(text, /o/, 2)
		if (split.length > 1) {
			let a = Value.parse(split[0], global, local, TypE.vector)
			if (a) {
				let b = Value.parse(split[1], global, local, TypE.vector)
				if (b)
					return new NumOp(numOp.scalar, [a, b])
				else
					return null
			}
		}
		return null
	}

	toString(global: boolean = true): string {
		if (this.operator.includes("$"))
			return this.operator.replace(/\$p(\d+)\$/g, (a, b) => { return (this.values[parseFloat(b)] || "Null").toString(global) })
		return this.operator + "(" + this.values[0].toString(global) + ", " + this.values[1].toString(global) + ")"
	}
}
//#endregion
//#region Vector

export class VectorConst extends AbstractValue {
	static typE = TypE.vector
	value: string | [Value, Value, Value]

	set const(v) { }
	get const() {
		return this.value instanceof Array ? this.value.every((v) => v.const) : true
	}
	constructor(comments?: Comment[], v: string | [Value, Value, Value] = "(0, 0, 0)") {
		super(comments)
		this.value = v
	}
	toString(global: boolean = true) {
		return typeof this.value == "string" ? this.value : "(" + this.value.join(", ") + ")"
	}
	static parse(text: string, global: VariableBlock, local?: VariableBlock, ...any: any[]): Value | null {
		var m = /(?<direction>left|right|forward|backward|up|down)$/i.exec(text)
		if (m && m.groups) {
			return new VectorConst([], toTitle(m.groups.direction))
		}
		let split = splitWP(text, /,/)
		let val = []
		if (split.length == 3) {
			for (let i = 0; i < split.length; i++) {
				let l = Value.parse(split[i], global, local, TypE.number)
				if (l)
					val.push(l)
				else
					return null
			}
			return new VectorConst([], val as [Value, Value, Value])
		}
		return null
	}
}

enum vectorOp {
	plus = "Add", minus = "Subtract", times = "Multiply", divide = "Divide", cross = "Cross Product"
}

export class VectorOp extends AbstractValue {
	static typE = TypE.vector



	operator: vectorOp
	values: Value[]

	set const(v) { }
	get const() {
		return this.values.every((v) => v.const)
	}
	getArray() {
		return _.flatten(_.map(this.values, (v) => v.getArray()))
	}

	constructor(comments?: Comment[], values?: Value[], operator?: vectorOp)
	constructor(operator: vectorOp, values: Value[], comments?: Comment[])
	constructor(co_op: any, va: Value[] = [new VectorConst, new VectorConst], op_co: any) {
		if (co_op instanceof Array || co_op == undefined) {
			super(co_op)
			this.operator = op_co || vectorOp.plus
			this.values = va
		}
		else {
			super(op_co)
			this.operator = co_op
			this.values = va
		}
	}
	static parse(text: string, global: VariableBlock, local?: VariableBlock): Value | null {
		text = text.replace(/[\s\n]*/g, "")
		var split = splitWP(text, /\+/, 2)
		if (split.length > 1) {
			let a = Value.parse(split[0], global, local, [TypE.vector, TypE.number])
			let b = Value.parse(split[1], global, local, [TypE.vector, TypE.number])
			if (a == null || b == null) return null
			else
				return new VectorOp(vectorOp.plus, [a, b])
		}
		var split = splitWP(text, /-/)
		if (split.length > 1) {
			split[0] = split.slice(0, split.length - 1).join("-")
			split[1] = split[split.length - 1]
			let a = split[0] == "" ? new NumConst : Value.parse(split[0], global, local, [TypE.vector, TypE.number])
			let b = Value.parse(split[1], global, local, [TypE.vector, TypE.number])
			if (a == null || b == null) return null
			else
				return new VectorOp(vectorOp.minus, [a, b])
		}
		var split = splitWP(text, /\//)
		if (split.length > 1) {
			split[0] = split.slice(0, split.length - 1).join("/")
			split[1] = split[split.length - 1]
			let a = Value.parse(split[0], global, local, [TypE.vector, TypE.number])
			let b = Value.parse(split[1], global, local, [TypE.vector, TypE.number])
			if (a == null || b == null) return null
			else
				return new VectorOp(vectorOp.divide, [a, b])
		}
		var split = splitWP(text, /x/, 2)
		if (split.length > 1) {
			let a = Value.parse(split[0], global, local, TypE.vector)
			if (a) {
				let b = Value.parse(split[1], global, local, TypE.vector)
				if (b)
					return new VectorOp(vectorOp.cross, [a, b])
				else
					return null
			}
		}
		var split = splitWP(text, /\*/, 2)
		if (split.length > 1) {
			let a = Value.parse(split[0], global, local, [TypE.vector, TypE.number])
			let b = Value.parse(split[1], global, local, [TypE.vector, TypE.number])
			if (a == null || b == null) return null
			else
				return new VectorOp(vectorOp.times, [a, b])
		}
		return null
	}

	toString(global: boolean = true, any?: any, stack = []): string {
		if (this.operator.includes("$"))
			return this.operator.replace(/\$p(\d+)\$/g, (a, b) => { return (this.values[parseFloat(b)] || "Null").toString(global) })
		return this.operator + "(" + this.values[0].toString(global) + ", " + this.values[1].toString(global) + ")"
	}
}
//#endregion

//#region Bool

export enum boolOp {
	not = "not", and = "and", nand = "nand", or = "or", nor = "nor", xor = "xor", limply = "limply", rimply = "rimply", lnimply = "lnimply", rnimply = "rnimply"
}

export class BoolOp extends AbstractValue {
	operator: boolOp
	values: Value[]

	set const(v) { }
	get const() {
		return this.values.every((v) => v.const)
	}
	getArray() {
		return _.flatten(_.map(this.values, (v) => v.getArray()))
	}
	static typE = TypE.bool
	constructor(comments?: Comment[], operator: boolOp = boolOp.and, values?: Value[]) {
		super(comments)
		this.operator = operator
		this.values = values || []
	}
	static parse(text: string, global: VariableBlock, local?: VariableBlock): BoolOp | null {
		text = text.replace(/[\s\n]*/g, "")
		var split = splitWP(text, /\^\^/)
		if (split.length > 1) {
			let a = Value.parse(split[0], global, local, TypE.bool)
			let b = Value.parse(split[1], global, local, TypE.bool)
			if (a == null || b == null) return null
			else
				return new BoolOp(undefined, boolOp.xor, [a, b])
		}
		split = splitWP(text, /!\|/)
		if (split.length > 1) {
			let array: (Value | null)[] = []
			split.forEach(e => {
				array.push(Value.parse(e, global, local, TypE.bool))
			})
			if (trueForAny(array, null)) return null
			else
				return new BoolOp(undefined, boolOp.nor, array as Value[])
		}
		split = splitWP(text, /\|\|/, 2)
		if (split.length > 1) {
			let a = Value.parse(split[0], global, local, TypE.bool)
			let b = Value.parse(split[1], global, local, TypE.bool)
			if (a == null || b == null) return null
			else
				return new BoolOp(undefined, boolOp.or, [a, b])
		}
		split = splitWP(text, /!&/)
		if (split.length > 1) {
			let array: (Value | null)[] = []
			split.forEach(e => {
				array.push(Value.parse(e, global, local, TypE.bool))
			})
			if (trueForAny(array, null)) return null
			else
				return new BoolOp(undefined, boolOp.nand, array as Value[])
		}
		split = splitWP(text, /&&/, 2)
		if (split.length > 1) {
			let a = Value.parse(split[0], global, local, TypE.bool)
			let b = Value.parse(split[1], global, local, TypE.bool)
			if (a == null || b == null) return null
			else
				return new BoolOp(undefined, boolOp.and, [a, b])
		}
		if (/^!/.test(text)) {
			let a = Value.parse(text.substr(1), global, local, TypE.bool)
			if (a == null) return null
			else return new BoolOp(undefined, boolOp.not, [a])
		}
		return null
	}

	toString(global: boolean = true, indent = "", stack = [], cond = false): string {
		if (cond)
			if (this.operator == boolOp.not)
				return this.values[0].toString(global, indent, stack) + " == False"
			else
				return this.toString(global, indent, stack) + " == True"
		switch (this.operator) {
			case boolOp.and:
				return "And(" + this.values[0].toString(global) + ", " + this.values[1].toString(global) + ")"
			case boolOp.or:
				return "Or(" + this.values[0].toString(global) + ", " + this.values[1].toString(global) + ")"
			case boolOp.not:
				return "Not(" + this.values[0].toString(global) + ")"
			case boolOp.nand:
				let ands: Value = this.values.pop() as Value
				this.values.forEach(e => {
					ands = new BoolOp(undefined, boolOp.and, [ands, e])
				})
				return new BoolOp(undefined, boolOp.not, [ands]).toString(global)
			case boolOp.nor:
				let ors: Value = this.values.pop() as Value
				this.values.forEach(e => {
					ors = new BoolOp(undefined, boolOp.or, [ors, e])
				})
				return new BoolOp(undefined, boolOp.not, [ors]).toString(global)
			case boolOp.xor:
				return new BoolOp(undefined, boolOp.and,
					[new BoolOp(undefined, boolOp.nand, [this.values[0], this.values[1]]),
					new BoolOp(undefined, boolOp.or, [this.values[0], this.values[1]])]).toString(global)
			default:
				return "False"
		}
	}
}

export enum cond {
	e = "==", l = "<", m = ">", le = "<=", me = ">=", ne = "!="
}
export class Comp extends AbstractValue {

	set const(v) { }
	get const() {
		return [this.value1, this.value2].every((v) => v.const)
	}
	condition = cond.e
	value1: Value
	value2: Value
	getArray() {
		return _.flatten(_.map([this.value1, this.value2], (v) => v.getArray()))
	}
	static typE = TypE.bool
	constructor(comments?: Comment[], operator = cond.e, a?: Value, b?: Value) {
		super(comments)
		this.condition = operator
		this.value1 = a || new BoolConst
		this.value2 = b || new BoolConst
	}
	static parse(text: string, global: VariableBlock, local?: VariableBlock): Comp | null {
		text = text.replace(/[\s\n]*/g, "")
		var split = splitWP(text, /(==|<=|>=|<|>|!=)/, 2)
		if (split.length > 1) {
			let a = Value.parse(split[0], global, local)
			if (a == null) return null
			let b = Value.parse(split[1], global, local, a.type)
			if (b == null) return null
			let eq = /^(==|<=|>=|<|>|!=)/.exec(text.substring(split[0].length)) as RegExpExecArray
			switch (eq[1]) {
				case "==":
					return new Comp(undefined, cond.e, a, b)
				case "<":
					return new Comp(undefined, cond.l, a, b)
				case ">":
					return new Comp(undefined, cond.m, a, b)
				case "<=":
					return new Comp(undefined, cond.le, a, b)
				case ">=":
					return new Comp(undefined, cond.me, a, b)
				case "!=":
					return new Comp(undefined, cond.ne, a, b)
			}
		}
		return null
	}

	toString(global: boolean = true, indent = "", stack = [], cond = false) {
		if (cond)
			return this.value1.toString(global) + " " + this.condition + " " + this.value2.toString(global)
		else return "Compare(" + this.value1.toString(global) + ", " + this.condition + ", " + this.value2.toString(global) + ")"
	}
}


export class BoolConst extends AbstractValue {
	value: boolean
	const = true
	static typE = TypE.bool
	constructor(comms?: Comment[], value: boolean = false) {
		super(comms)
		this.value = value
	}
	static parse(text: string, ...args: any[]): BoolConst | null {

		if (/^(false)$/.test(text))
			return new BoolConst(undefined, false)
		if (/^(true)$/.test(text))
			return new BoolConst(undefined, true)
		return null
	}

	toString(global: boolean = true, indent = "", stack = [], con = false) {
		if (con)
			if (this.value)
				return "True == True"
			else
				return "False == True"
		else
			if (this.value)
				return "True"
			else
				return "False"
	}
}

//#endregion

//#region simple Const

export enum PlayerE {
	all = "All", ana = "Ana", ashe = "Ashe", baptiste = "Baptiste", bastion = "Bastion", brigitte = "Brigitte", dva = "D.VA", doomfist = "Doomfist", genji = "Genji", hanzo = "Hanzo", junkrat = "Junkrat", lúcio = "Lúcio", mccree = "McCree", mei = "Mei", mercy = "Mercy", moira = "Moira", orisa = "Orisa", pharah = "Pharah", reaper = "Reaper", reinhardt = "Reinhardt", roadhog = "Roadhog", slot0 = "Slot 0", slot1 = "Slot 1", slot10 = "Slot 10", slot11 = "Slot 11", slot2 = "Slot 2", slot3 = "Slot 3", slot4 = "Slot 4", slot5 = "Slot 5", slot6 = "Slot 6", slot7 = "Slot 7", slot8 = "Slot 8", slot9 = "Slot 9", soldier76 = "Soldier: 76", sombra = "Sombra", symmetra = "Symmetra", torbjörn = "Torbjörn", tracer = "Tracer", widowmaker = "Widowmaker", winston = "Winston", wreckingBall = "Wrecking Ball", zarya = "Zarya", zenyatta = "Zenyatta"
}


export class PlayerConst extends AbstractValue {
	value: PlayerE
	static typE = TypE.playerConst
	typE = Type.get(PlayerConst.typE)
	constructor(comments?: Comment[], player?: PlayerE) {
		super(comments)
		this.value = player || PlayerE.all
	}

	static parse(text: string, ...args: any[]): PlayerConst | null {
		text = text.replace(/[\s\n]*/g, "")
		if (/^[\s\n\r]*$/.test(text))
			return new PlayerConst()
		let match = /Player[\s\n\r]*.[\s\n\r]*(.*?)$/.exec(text)
		if (match != null) {
			switch (match[1]) {
				case "all":
					return new PlayerConst([], PlayerE.all)
				case "ana":
					return new PlayerConst([], PlayerE.ana)
				case "ashe":
					return new PlayerConst([], PlayerE.ashe)
				case "baptiste":
					return new PlayerConst([], PlayerE.baptiste)
				case "bastion":
					return new PlayerConst([], PlayerE.bastion)
				case "brigitte":
					return new PlayerConst([], PlayerE.brigitte)
				case "dva":
					return new PlayerConst([], PlayerE.dva)
				case "doomfist":
					return new PlayerConst([], PlayerE.doomfist)
				case "genji":
					return new PlayerConst([], PlayerE.genji)
				case "hanzo":
					return new PlayerConst([], PlayerE.hanzo)
				case "junkrat":
					return new PlayerConst([], PlayerE.junkrat)
				case "lúcio":
				case "lùcio":
				case "lucio":
					return new PlayerConst([], PlayerE.lúcio)
				case "mccree":
					return new PlayerConst([], PlayerE.mccree)
				case "mei":
					return new PlayerConst([], PlayerE.mei)
				case "mercy":
					return new PlayerConst([], PlayerE.mercy)
				case "moira":
					return new PlayerConst([], PlayerE.moira)
				case "orisa":
					return new PlayerConst([], PlayerE.orisa)
				case "pharah":
					return new PlayerConst([], PlayerE.pharah)
				case "reaper":
					return new PlayerConst([], PlayerE.reaper)
				case "reinhardt":
					return new PlayerConst([], PlayerE.reinhardt)
				case "roadhog":
					return new PlayerConst([], PlayerE.roadhog)
				case "0":
					return new PlayerConst([], PlayerE.slot0)
				case "1":
					return new PlayerConst([], PlayerE.slot1)
				case "10":
					return new PlayerConst([], PlayerE.slot10)
				case "11":
					return new PlayerConst([], PlayerE.slot11)
				case "2":
					return new PlayerConst([], PlayerE.slot2)
				case "3":
					return new PlayerConst([], PlayerE.slot3)
				case "4":
					return new PlayerConst([], PlayerE.slot4)
				case "5":
					return new PlayerConst([], PlayerE.slot5)
				case "6":
					return new PlayerConst([], PlayerE.slot6)
				case "7":
					return new PlayerConst([], PlayerE.slot7)
				case "8":
					return new PlayerConst([], PlayerE.slot8)
				case "9":
					return new PlayerConst([], PlayerE.slot9)
				case "soldier76":
					return new PlayerConst([], PlayerE.soldier76)
				case "sombra":
					return new PlayerConst([], PlayerE.sombra)
				case "symmetra":
					return new PlayerConst([], PlayerE.symmetra)
				case "torbjörn":
				case "torbjorn":
					return new PlayerConst([], PlayerE.torbjörn)
				case "tracer":
					return new PlayerConst([], PlayerE.tracer)
				case "widowmaker":
					return new PlayerConst([], PlayerE.widowmaker)
				case "winston":
					return new PlayerConst([], PlayerE.winston)
				case "wreckingBall":
					return new PlayerConst([], PlayerE.wreckingBall)
				case "zarya":
					return new PlayerConst([], PlayerE.zarya)
				case "zenyatta":
					return new PlayerConst([], PlayerE.zenyatta)
			}
		}

		return null
	}

	toString(global: boolean = true, indent = "", stack = [], event = false): string {
		if (event)
			return this.value
		//TODO observe behavior in FFA
		switch (this.value) {
			case PlayerE.slot0:
			case PlayerE.slot1:
			case PlayerE.slot2:
			case PlayerE.slot3:
			case PlayerE.slot4:
			case PlayerE.slot5:
				return "Players In Slot(" + this.value.substr(5) + ", Team 1)"
			case PlayerE.slot6:
			case PlayerE.slot7:
			case PlayerE.slot8:
			case PlayerE.slot9:
			case PlayerE.slot10:
			case PlayerE.slot11:
				return "Players In Slot(" + (Number.parseInt(this.value.substr(5)) - 6) + ", Team 2)"
			default:
				return "Value In Array(Players On Hero(Hero(" + this.value + "), 0)"
		}
	}
}

export enum TeamE {
	all = "All", team1 = "Team 1", team2 = "Team 2"
}

export class TeamConst extends AbstractValue {
	value: any
	static typE = TypE.teamConst
	typE = Type.get(TeamConst.typE)
	constructor(comments?: Comment[], team?: TeamE) {
		super(comments)
		this.value = team || TeamE.all
	}

	static parse(text: string, ...args: any[]): TeamConst | null {
		text = text.replace(/[\s\n]*/g, "")
		if (/^[\s\n\r]*$/.test(text))
			return new TeamConst()
		let match = /^Team.(.*)/.exec(text)
		if (match != null) {
			switch (match[1]) {
				case "all":
					return new TeamConst([], TeamE.all)
				case "0":
					return new TeamConst([], TeamE.team1)
				case "1":
					return new TeamConst([], TeamE.team2)
			}
		}
		return null
	}

	toString(): string {
		return this.value
	}
}

//#endregion

//#region Array

export class ArrayInit {
	value: ArrayConst | undefined | string
	static arrayBuild = "D"
	constructor(value?: ArrayConst | string) {
		this.value = value
	}
	toString(global: boolean = true, indent: string = "") {
		indent += "\t"
		if (typeof this.value != "object")
			return this.value || ""
		var s = ""
		for (let i = 0; i < this.value.value.length; i++) {
			s += "Set " + (global ? "Global" : "Player") + " Variable At Index(" + ArrayInit.arrayBuild + ", " + i + ", " + this.value.value[i].toString(global) + ");\n" + indent
		}
		return "// [" + this.value.value + "]\n" + indent + s + "Set " + (global ? "Global" : "Player") + " Variable At Index(" + ArrayConst.arrayStorage + ", " + this.value.index + ", " + (global ? "Global" : "Player") + " Variable(" + ArrayInit.arrayBuild + "));\n" + indent +
			"Set " + (global ? "Global" : "Player") + " Variable(" + ArrayInit.arrayBuild + ", Empty Array);"
	}


	public get rows(): number {
		return typeof this.value == "object" ? this.value.value.length ? this.value.value.length + 2 : 0 : 0
	}


	static constArray: ArrayInit[] = []
}

export class ArrayConst extends AbstractValue {
	value: Value[]

	set const(v) { }
	get const() {
		return this.value.every((v) => v.const) && this.value.length > 0
	}
	static index: number = 0
	index: number
	getArray() {
		return this.value.length > 0 ? this.const ? new ArrayInit("// [" + this.value + "]") : new ArrayInit(this) : new ArrayInit
	}


	public get type(): Type {
		return this.value.length > 0 ? new ArrayType(this.value[0].type) : Type.undefined
	}

	public set type(v) { }

	static arrayStorage = "C"
	constructor(comments?: Comment[], v: Value[] = []) {
		super(comments)
		this.value = v
		this.index = ArrayConst.index++
		if (this.const) {
			ArrayInit.constArray.push(new ArrayInit(this))
		}
		//this.index = ArrayConst.arrayConsts.push(v) - 1
	}
	toString(global: boolean = true) {
		if (this.value.length == 0)
			return "Empty Array"
		return "Value In Array(" + (global ? "Global" : "Player") + " Variable(" + ArrayConst.arrayStorage + "), " + this.index + ")"
	}

	static parse(text: string, global: VariableBlock, local?: VariableBlock, type: Type | TypE = TypE.undefined): Value | null {
		if (text == "[]")
			return new ArrayConst(undefined, [])
		if (text.startsWith("[")) {
			if (findParan(text, "[]", true) == text.length - 1) {
				let split = splitWP(text.substring(1, text.length - 1), /,/)
				var values = [Value.parse(split.shift() as string, global, local)]
				if (values[0] && (<Value>values[0]).type.saveAble && (Type.as(type) == Type.undefined || new ArrayType((<Value>values[0]).type) == Type.as(type))) {
					_.find(split, (s) => {
						let v = Value.parse(s, global, local, (<Value>values[0]).type)
						if (!v)
							return true
						values.push(v)
						return false
					})
					if (values.length > split.length)
						return new ArrayConst(undefined, values as Value[])
				}
			}

		}

		return null
	}
}

export class ArrayAccess extends AbstractValue {
	index: Value
	public get type() {
		return (this.value.type as ArrayType).type
	}

	set const(v) { }
	get const() {
		return this.value.const
	}
	public set type(v) { }

	constructor(c?: Comment[], v?: Value, index?: Value) {
		super(c, v)
		this.index = index || new NumConst
	}

	static parse(text: string, global: VariableBlock, local?: VariableBlock, type: Type | TypE = TypE.undefined): Value | null {
		if (text.endsWith("]")) {
			let start = findParan(text, "[]", true, -1)
			if (start > 0) {
				let index = Value.parse(text.substring(start + 1, text.length - 1), global, local, TypE.number)
				if (index) {
					let array = Value.parse(text.substring(0, start), global, local, Type.as(type) == Type.undefined ? undefined : new ArrayType(type))
					if (array && array.type.name == TypE.array) {
						return new ArrayAccess([], array, index)
					}
				}
			}
		}

		return null
	}

	toString(global: boolean = true): string {
		return "Value In Array(" + this.value.toString(global) + ", " + this.index.toString(global) + ")"
	}


}


//#endregion


export class Type {
	static instance(t: Object): boolean {

		return t instanceof Type || t instanceof ArrayType
	}
	name: TypE
	saveAble: boolean
	translation?: string
	values: typeof Value[]
	defau: Value | null | string
	static boolables: (Type | TypE)[] = [TypE.player, TypE.number]
	props: Properties
	get(key: string, array = false): typeof Prop | undefined {
		return this.props.get(key, array)
	}
	modifiers: string[] = []
	static get undefined(): Type {
		return Type.get(TypE.undefined)
	}

	op(op: string): string {
		switch (op) {
			case "+":
				return "Add"
			case "/":
				return "Divide"
			case "%":
				return "Modulo"
			case "*":
				return "Multiply"
			case "^":
				return "Raise To Power"
			case "-":
				return "Subtract"

			default:
				return op
		}
	}


	public get undefined(): boolean {
		return this.name == TypE.undefined
	}

	static as(type?: Type | TypE): Type {
		if (typeof type == "string")
			if (Type.has(type))
				type = Type.get(type)
			else
				type = Type.get(TypE.undefined)
		return type || Type.undefined
	}

	constructor(name: TypE, values: typeof Value[], props: Properties | Map<string, typeof Prop> | [string, typeof Prop][], arrayProps: Map<string, typeof Prop> | [string, typeof Prop][] = [], saveAble: boolean = true, translation?: string, modifiers: string[] = [], defau: Value | string | null = null) {
		this.name = name
		this.saveAble = saveAble
		//TODO playerprop
		this.translation = translation || toCamelSep(name)
		this.props = props instanceof Properties ? props : new Properties(props instanceof Map ? props : new Map(props), !arrayProps || arrayProps instanceof Map ? arrayProps : new Map(arrayProps))

		this.values = values
		this.modifiers = modifiers

		this.defau = defau
	}
	static types: Map<string, Type> = new Map()
	//TODO Array append Array.
	/**
		throws: SynErr
	*/
	static parse(text: string): Type {
		var value: Type | undefined
		while (text.endsWith("[]")) {
			value = new ArrayType(Type.parse(text.substr(0, text.length - 2)))
			if ((value as ArrayType).type == Type.get(TypE.undefined))
				value = undefined
			text = text.substr(0, text.length - 2)
		}
		if (!value) {
			_.each(_.pairs(TypE), (v) => { if ((v[1] as string) == text) value = Type.get(v[1]) })
		}
		if (value == undefined)
			throw new SynErr(0, text.length, DiagnosticSeverity.Error, "'" + text + "' is not a Valid Type")
		return value
	}


	static get = (k?: TypE) => Type.types.get(k || TypE.undefined) as Type

	static has = (k: TypE) => {
		return Type.types.has(k)
	}

	public equals(obj: Object): boolean {
		return obj.toString() == this.toString()
	}

	toString() {
		return this.translation || this.name
	}
}



export class ArrayType extends Type {
	saveAble: boolean = true;
	public get translation(): string {
		return toCamelSep((this.type ? this.type.name : "")) + "[]"
	}
	public set translation(v: string) { }
	values: (typeof Value)[] = [];
	public get props(): Properties {
		return this.type.props.array
	}
	public set props(v) { };

	get(key: string, array = true): typeof Prop | undefined {
		return this.type.props.get(key, array)
	}
	invProps: { type: TypE; name: string }[] = [];
	public equals(obj: Object): boolean {
		return obj.toString() == this.toString()
	}
	name = TypE.array

	public get type(): Type {
		return Type.as(this.t)
	}
	private t: Type | TypE
	constructor(type: TypE | Type) {
		super(TypE.array, [], [], [])
		this.t = type
	}
}

Type.types = new Map([
	toType(TypE.abilities, [], [
		toProp("1", "1", TypE.ability),
		toProp("2", "2", TypE.ability)], false),
	toType(TypE.ability, [], [
		toProp("enable", "Set Ability $v$ Enabled($--v$, True)", TypE.void),
		toProp("disable", "Set Ability $v$ Enabled($--v$, False)", TypE.void)], false),
	toType(TypE.button, [], [
		toProp("enable", "Allow Button($--v$, $v$)", TypE.void),
		//TODO: disable
		toProp("disable", "Set Ability $v$ Enabled($--v$, False)", TypE.void)], false),
	toType(TypE.color, false),
	toType(TypE.hero, [], [
		toProp("icon", "Hero Icon String($v$)", TypE.string)
	]),
	toType(TypE.playerConst, [PlayerConst], [], false, "Player Constant"),
	toType(TypE.longVisualEffect, false), toType(TypE.longAudibleEffect, false),
	toType(TypE.icon, false), toType(TypE.space, false), toType(TypE.hudLocation, false),
	toType(TypE.shortVisualEffect, false), toType(TypE.shortAudibleEffect, false),
	toType(TypE.status, false),
	toType(TypE.string, [StringConst], false, "String Constant"), toType(TypE.communicate, false),
	toType(TypE.teamConst, [TeamConst], false, "Team Constant"),
	toType(TypE.hudText, [Class]),
	toType(TypE.number, [NumConst, NumOp], [toProp("abs", "Absolute Value($v$)", TypE.number),
	toProp("min", "Min($p$)", TypE.number, ["v", TypE.number]),
	toProp("max", "Max($p$)", TypE.number, ["v", TypE.number]),
	toProp("in", "Max(Min($p0$, $p1$), $p2$)", TypE.number, ["v", TypE.number, TypE.number]),
	], true, "Number", "+-/*^%"),
	toType(TypE.vector, [VectorConst, VectorOp], [
		toProp("distance", ["Distance Between($p$)"], TypE.number, ["v", [TypE.player, TypE.vector]]),
		toProp("direction", ["Direction Towards($p$)"], TypE.vector, ["v", [TypE.player, TypE.vector]]),
	]),
	toType(TypE.team, [], [
		toProp("roundVictory", "Declare Round Victory($v$)"),
		toProp("victory", "Declare Team Victory($v$)"),
		toProp("score", ["Team Score($v$)", "Set Team Score($v$, $s$)", "Modify Team Score($v$, $s$)"], TypE.number, [], "+"),
	], [toProp("score", [null, "Set Team Score($v$, $s$)", "Modify Team Score($v$, $s$)"], TypE.number, [], "+")]),
	toType(TypE.undefined),
	toType(TypE.world, [], [
		toProp("destroyAll", (v, g, i = "") => { return "Destroy All Effects();\n" + i + "Destroy All Icons();\n" + i + "Destroy All In-World Text()" }, TypE.void, [], undefined, 3)
	]),
	toType(TypE.array, [], [
		toProp("length", "Count Of($v$)", TypE.number),
		toProp("contains", "Array Contains($p$)", TypE.bool, ["v", "-[]"]),
		toProp("push", (v, g) => {
			if (v instanceof Array && v[0] instanceof Variable) {
				let l = v[0] as Variable
				let val = v[1]
				return "Modify " + (global || l.global ? "Global" : "Player") + " Variable At Index(" + (l.global ? "A, " + l.pointer : "B, " + (l.pointer as number + localRuleInd)) + ", Append To Array, " + val.toString(g) + ")"
			}
			return ""
		}, TypE.void, ["v", "-[]"]),
		toProp("filter", "Filtered Array($p$)", "t", ["v", (v, t, g, l) => {
			g.temp("elem", Elem(v))
			let val = Value.parse(t, g, l, TypE.bool)
			g.temp("elem")
			return val
		}]),
		toProp("trueForAll", "Is True For All($p$)", "t", ["v", (v, t, g, l) => {
			g.temp("elem", Elem(v))
			let val = Value.parse(t, g, l, TypE.bool)
			g.temp("elem")
			return val
		}]),
		toProp("trueForAny", "Is True For Any($p$)", "t", ["v", (v, t, g, l) => {
			g.temp("elem", Elem(v))
			let val = Value.parse(t, g, l, TypE.bool)
			g.temp("elem")
			return val
		}]),
		toProp("sort", "Sorted Array($p$)", "t", ["v", (v, t, g, l) => {
			g.temp("elem", Elem(v))
			let val = Value.parse(t, g, l, TypE.number)
			g.temp("elem")
			return val
		}])
	], true),
	toType(TypE.bool, [BoolConst, Comp, BoolOp], true, "Boolean", undefined, "true"),
	toType(TypE.void, [], [toProp("wait", "Wait($p$, Ignore Condition)", TypE.void, [TypE.number])]),
	toType(TypE.game, [], [
		toProp("draw", "Declare Match Draw()", TypE.void),
		toProp("assemble", "Go To Assemble Heroes()", TypE.void),
		toProp("pauseTime", "Pause Match Time()"),

		toProp("destroyEffects", "Destroy All Effects()"),
		toProp("destroyHUD", "Destroy All HUD Text()"),
		toProp("destroyIcons", "Destroy All Icons()"),
		toProp("destroyWorldText", "Destroy All In-World Text()"),
		toProp("destroyText", "Destroy All HUD Text(); Destroy All In-World Text()"),
		toProp("destroyAll", "Destroy All Effects(); Destroy All HUD Text(); Destroy All Icons(); Destroy All In-World Text()"),

		toProp("enableAnnouncer", "$p0|Enable Built-In Game Mode Announcer|Disable Built-In Game Mode Announcer()", TypE.void, [TypE.bool]),
		toProp("enableCompletion", "$p0|Enable Built-In Game Mode Completion|Disable Built-In Game Mode Completion()", TypE.void, [TypE.bool]),
		toProp("enableMusic", "$p0|Enable Built-In Game Mode Music|Disable Built-In Game Mode Music()", TypE.void, [TypE.bool]),
		toProp("enableScoring", "$p0|Enable Built-In Game Mode Scoring|Disable Built-In Game Mode Scoring()", TypE.void, [TypE.bool]),
		toProp("matchTime", [null, "Set Match Time($v$, $s$)"], TypE.number),

		toProp("slowMotion", [null, "Set Slow Motion($s$)"], TypE.number),

	], false),
	toType(TypE.player, [], [
		arProp("abilities", "abilities", TypE.abilities),
		arProp("accelerate", "Start Accelerating($p$)", TypE.void, ["v", TypE.vector, TypE.number, TypE.number]),
		arProp("aimSpeed", [null, "Set Aim Speed($v$, $s$)"], TypE.number),
		toProp("alive", "Is Alive($v$)", TypE.bool),
		toProp("applyImpulse", "Apply Impules($p0$, $p1$, $p2$, $p3|To World|To Player$, $p4|Cancel Contrary Motion|Incorporate Contrary Motion$)", TypE.void, ["v", TypE.vector, TypE.number, TypE.bool, TypE.bool]),
		toProp("communicate", "Communicate($p$)", TypE.void, ["v", [TypE.emote, TypE.voiceLine, TypE.communicate]]),
		arProp("damage", "Damage($p0$, $p2$, $p1$)", TypE.void, ["v", TypE.number, [TypE.null, TypE.player]]),
		toProp("dead", "Is Dead($v$)", TypE.bool),
		arProp("deathSpectateAll", "$p1|Enable Death Spectate All Players|Disable Death Spectate All Players$($p0$)", TypE.void, ["v", TypE.bool]),
		arProp("deathSpectateHUD", "$p1|Enable Death Spectate Target HUD|Disable Death Spectate Target HUD$($p0$)", TypE.void, ["v", TypE.bool]),
		toProp("direction", ["Direction Towards($p$)"], TypE.vector, ["v", [TypE.player, TypE.vector]]),
		toProp("distance", ["Distance Between($p$)"], TypE.number, ["v", [TypE.player, TypE.vector]]),
		toProp("dot", "Start Damage Over Time($p0$, Null, $p1$, $p2$)", TypE.void, ["v", TypE.number, TypE.number]),
		arProp("enableRespawn", "$p1|Enable Built-In Game Mode Respawning|Disable Built-In Game Mode Respawning$($p0$)", TypE.void, ["v", TypE.bool]),
		arProp("enableButton", "$p2|Allow Button|Disallow Button$($p0$, $p1$)", TypE.void, ["v", TypE.button, TypE.bool]),
		toProp("exists", "Entity Exists($v$)", TypE.bool),
		arProp("face", "Set Facing($p0$, $p1$, $p2|To World|To Player$)", TypE.void, ["v", TypE.vector, TypE.bool]),
		arProp("gravity", [null, "Set Gravity($v$, $s$)"], TypE.number),
		arProp("heal", "Heal($p0$, $p2$, $p1$)", TypE.void, ["v", TypE.number, [TypE.null, TypE.player]]),
		arProp("healGive", [null, "Set Healing Dealt($v$, $s$)"], TypE.number),
		arProp("healReceive", [null, "Set Healing Received"], TypE.number),
		arProp("heroes", [null, "Set Player Allowed Heroes($v$, $s$)"], [TypE.hero, new ArrayType(TypE.hero)]),
		toProp("holding", ["Is Button Held($p$)"], TypE.bool, ["v", TypE.button]),
		arProp("invisible", "Set Invisible($v$, All)"),
		arProp("invisibleTo", [null, "Set Invisible($v$, $s$)"], TypE.side),
		arProp("kill", "Kill($p0$, $p1$)", TypE.void, ["v", [TypE.null, TypE.player]]),
		arProp("maxHealth", [null, "Set Max Health($v$, $s$)"], TypE.number),
		arProp("objective", [null, "Set Objective Description($v$, $s$, String)"], TypE.string),
		toProp("position", "Position Of($v$)", TypE.vector),
		arProp("preLoadHero", "Preload Hero($p$)", TypE.void, ["v", TypE.hero]),
		arProp("pressButton", "Press Button", TypE.void, ["v", TypE.button]),
		arProp("primaryFire", [null, "Set Primary Fire Enabled($v$, $s$)"], TypE.bool),
		arProp("projectileGravity", [null, "Set Projectile Gravity($v$, $s$)"], TypE.number),
		arProp("projectileSpeed", [null, "Set Projectile Speed($v$, $s$)"], TypE.number),
		toProp("rayCast", ["Ray Cast Hit Player(Eye Position($p0$), Add(Multiply($p1$, Facing Direction Of($p0$)), Eye Position($p0$))"], TypE.player, ["v", TypE.number, [TypE.player, new ArrayType(TypE.player)]]),
		arProp("resetHerosAvalible", "Reset Player Hero Availability($v$)"),
		arProp("respawn", "Respawn($v$)"),
		arProp("respawnTime", [null, "Set Respawn Max Time($v$, $s$)"], TypE.number),
		arProp("resurrect", "Resurrect($v$)"),
		toProp("score", ["Score Of($v$)", "Set Player Score($v$, $s$)", "Modify Player Score($v$, $s$)"], TypE.number, [], "+"),
		arProp("secondaryFire", [null, "Set Secondary Fire Enabled($v$, $s$)"], TypE.bool),
		arProp("setStatus", "Set Status($p0$, $p3$, $p1$, $p2$)", TypE.void, ["v", TypE.status, TypE.number, TypE.player]),
		arProp("speed", [null, "Set Move Speed($v$, $s$)"], TypE.number),
		arProp("startCamera", "Start Camera($p$)", TypE.void, ["v", TypE.vectory, TypE.vectory, TypE.number]),
		arProp("startDamageMod", "Start Damage Modification($p0$, $p1$, $p2$, $p3|Receivers, Damagers, And Damage Percent|None$, )", TypE.void, ["v", TypE.playery, TypE.number, TypE.bool], undefined, undefined, "Last Damage Modification ID()", TypE.damageModification),
		arProp("strength", [null, "Set Damage Dealt($v$, $s$)"], TypE.number),
		arProp("updatingObjective", [null, "Set Objective Description($v$, $s$, Visible To and String)"], TypE.string),
		arProp("ultimate", [null, "Set Ultimate Ability Enabled($v$, $s$)"], TypE.bool),
		arProp("ultimateCharge", [null, "Set Ultimate Charge($v$, $s$)"], TypE.number),
		toProp("vertFacingAngle", "Vertical Facing Angle Of($v$)", TypE.number),
		toProp("victory", "Declare Player Victory($v$)"),
		arProp("visible", "Set Invisible($v$, None)"),
		arProp("weakness", [null, "Set Damage Received($v$, $s$)"], TypE.number),
	], [toProp("score", [null, "Set Player Score($v$, $s$)", "Modify Player Score($v$, $s$)"], TypE.number, [], "+")], true, undefined, undefined, "event.player"),
	toType(TypE.null, undefined, undefined, undefined, "null"),
])
class ConstValue extends AbstractValue {
	const = true
	translation: string | ((v: string) => string) | undefined
	constructor(comments?: Comment[], value?: string, type?: Type, translation?: string | ((v: string) => string)) {
		super(comments, value)
		this.t = type
		this.translation = translation
	}

	static map: Map<string, Value> = new Map([["players", new ConstValue([], "All Players(All Teams)", new ArrayType(TypE.player))],
	["event.player", new ConstValue([], "Event Player", Type.get(TypE.player))], ["game", new ConstValue([], "Game", Type.get(TypE.game))],
	["alignment.left", new ConstValue([], "Left", Type.get(TypE.hudLocation))], ["alignment.center", new ConstValue([], "Top", Type.get(TypE.hudLocation))], ["alignment.right", new ConstValue([], "Right", Type.get(TypE.hudLocation))],
		//["color.blue", new ConstValue([], "Blue", Type.get(TypE.color))], ["color.green", new ConstValue([], "Green", Type.get(TypE.color))], ["color.purple", new ConstValue([], "Purple", Type.get(TypE.color))], ["color.red", new ConstValue([], "Red", Type.get(TypE.color))], ["color.team1", new ConstValue([], "Team 1", Type.get(TypE.color))], ["color.team2", new ConstValue([], "Team 2", Type.get(TypE.color))], ["color.white", new ConstValue([], "White", Type.get(TypE.color))], ["color.yellow", new ConstValue([], "Yellow", Type.get(TypE.color))],
		//toConstValues("vfx", [["badAura", "Bad Aura"]], TypE.longVisualEffect)
		//["elem", new ConstValue([], "Current Array Element", Type.get(TypE.color))]
	])
	static add(value: string | [string, string], typeP?: TypE | Type): void
	static add(base: string, value: (string | [string, string] | [string, TypE | Type] | [string, string, TypE | Type])[], typeP?: TypE | Type, translation?: string | ((v: string) => string)): void
	static add(base: string | [string, string], valueP?: (string | [string, string] | [string, TypE | Type] | [string, string, TypE | Type])[] | TypE | Type, typeP?: TypE | Type, translation?: string | ((v: string) => string)) {

		if (valueP instanceof Array) {
			let type = Type.as(typeP)
			valueP.forEach((v) => {
				let t: Type
				let name: string
				let value: string
				if (typeof v == "string") {
					value = v
					t = type
					name = toCamelSep(v)
				} else {
					value = v[0]
					if (v.length == 3) {
						t = Type.as(v[2])
						name = v[1] as string
					} else if (typeof v[1] == "string") {
						if ((<Type>type).undefined && Type.has(v[1] as TypE)) {
							t = Type.get(v[1] as TypE)
							name = toCamelSep(v[0])
						} else {
							t = type
							name = v[1]
						}
					} else {
						t = v[1]
						name = toCamelSep(v[0])
					}
				}
				this.map.set((base == "" ? "" : base + ".") + value, new ConstValue([], name, t, translation))

			})
		} else {
			let t = Type.as(valueP as any)
			let name: string
			let value: string
			if (typeof base == "string") {
				value = base
				name = toCamelSep(base)
			} else {
				value = base[0]
				name = base[1]
			}
			this.map.set(value, new ConstValue([], name, t, translation))
		}

	}

	static parse(text: string, ...args: any[]): Value | null {
		if (!/^([\p{Alphabetic}_][\p{Alphabetic}_0-9.]*)$/u.test(text))
			return null
		let v = ConstValue.map.get(text)
		if (v)
			return v
		return null
	}

	toString() {
		if (this.translation) {
			if (typeof this.translation == "function")
				return this.translation(this.value)
			else
				return this.translation.replace("$v$", this.value)
		}
		return this.value
	}
}



Value.parseables = [BoolConst, NumConst, NumOp, BoolOp, PlayerConst, TeamConst, ConstValue, Comp, StringConst, Variable, Prop, Class, ArrayConst, ArrayAccess, VectorConst, VectorOp]
Class.add("BigMessage", ["Big Message(All Players(All Teams), $p$)", [TypE.string]])
Class.add("BigMessage", ["Big Message($p1$, $p0$)", [TypE.string, new ArrayType(TypE.player)]])

Class.add("SmallMessage", ["Small Message(All Players(All Teams), $p$)", [TypE.string]])
Class.add("SmallMessage", ["Small Message($p1$, $p0$)", [TypE.string, new ArrayType(TypE.player)]])

Class.add("Effect", ["Create Effect(All Players(All Teams), $p$, 1, None)", [[TypE.longVisualEffect, TypE.longAudibleEffect], TypE.color, [TypE.vector, TypE.player]]])
Class.add("Effect", ["Create Effect($p3$, $p0$, $p1$, $p2$, 1, None)", [[TypE.longVisualEffect, TypE.longAudibleEffect], TypE.color, [TypE.vector, TypE.player], [TypE.player, new ArrayType(TypE.player)]]])
Class.add("Effect", ["Create Effect($p3$, $p0$, $p1$, $p2$, 1, $p4,p5|VISIBLE TO, POSITION, AND RADIUS|POSITION AND RADIUS|VISIBLE TO|NONE$)", [[TypE.longVisualEffect, TypE.longAudibleEffect], TypE.color, [TypE.vector, TypE.player], [TypE.player, new ArrayType(TypE.player)], TypE.bool, TypE.bool]])

Class.add("HUDText", ["Create HUD Text($p$, Visible To and String, Default Visibility)", [[TypE.player, new ArrayType(TypE.player)], TypE.string, TypE.string, TypE.string, TypE.hudLocation, TypE.number, TypE.color, TypE.color, TypE.color]])
Class.add("HUDText", ["Create HUD Text($p0$, $p1$, Null, Null, $p2$, 0, White, White, White, Visible To and String)", [[TypE.player, new ArrayType(TypE.player)], TypE.string, TypE.hudLocation]])
Class.add("HUDText", ["Create HUD Text($p0$, $p1$, Null, Null, Top, 0, White, White, White, Visible To and String)", [[TypE.player, new ArrayType(TypE.player)], TypE.string]])
Class.add("HUDText", ["Create HUD Text($p0$, $p1$, $p2$, Null, Top, 0, White, White, White, Visible To and String)", [[TypE.player, new ArrayType(TypE.player)], TypE.string, TypE.string]])
Class.add("HUDText", ["Create HUD Text($p0$, $p1$, $p2$, $p3$, Top, 0, White, White, White, Visible To and String)", [[TypE.player, new ArrayType(TypE.player)], TypE.string, TypE.string, TypE.string]])
Class.add("HUDText", ["Create HUD Text($p0$, $p1$, $p2$, $p3$, Top, 0, $p4$, $p4$, $p4$, Visible To and String)", [[TypE.player, new ArrayType(TypE.player)], TypE.string, TypE.string, TypE.string, TypE.color]])
Class.add("HUDText", ["Create HUD Text($p0$, $p1$, $p2$, $p3$, Top, 0, $p4$, $p4$, $p4$, $p5|Visible To and String|String$)", [[TypE.player, new ArrayType(TypE.player)], TypE.string, TypE.string, TypE.string, TypE.color, TypE.bool]])
Class.add("HUDText", ["Create HUD Text($p0$, $p1$, $p2$, $p3$, $p5$, $p6$, $p4$, $p4$, $p4$, Visible To and String)", [[TypE.player, new ArrayType(TypE.player)], TypE.string, TypE.string, TypE.string, TypE.color, TypE.hudLocation, TypE.number]])
Class.add("HUDText", ["Create HUD Text($p0$, $p1$, $p2$, $p3$, $p5$, $p6$, $p4$, $p4$, $p4$, $p7|Visible To and String|String$)", [[TypE.player, new ArrayType(TypE.player)], TypE.string, TypE.string, TypE.string, TypE.color, TypE.hudLocation, TypE.number, TypE.bool]])
Class.add("HUDText", ["Create HUD Text($p0$, $p1$, $p2$, $p3$, $p5$, $p7$, $p4$, $p6$, $p8$, $p9|Visible To and String|String$)", [[TypE.player, new ArrayType(TypE.player)], TypE.string, TypE.color, TypE.string, TypE.color, TypE.string, TypE.color, TypE.hudLocation, TypE.number, TypE.bool]])
Class.add("HUDText", ["Create HUD Text($p0$, $p1$, Null, Null, $p2$, $p3$, $p4$, White, White, Visible To and String)", [[TypE.player, new ArrayType(TypE.player)], TypE.string, TypE.hudLocation, TypE.number, TypE.color]])
Class.add("HUDText", ["Create HUD Text($p0$, $p1$, Null, Null, $p2$, $p3$, $p4$, White, White, Visible To and String)", [[TypE.player, new ArrayType(TypE.player)], TypE.string, TypE.hudLocation, TypE.color]])

Class.add("Icon", ["Create Icon($p3$, $p2$, $p0$, $p5,p6|Visible To And Position|Position|Visible To|None$, $p1$, $p4$)", [TypE.icon, TypE.color, TypE.vectory, TypE.playery, TypE.bool, TypE.bool, TypE.bool]])
Class.add("Icon", ["Create Icon($p3$, $p2$, $p0$, $p5|Visible To And Position|None$, $p1$, $p4$)", [TypE.icon, TypE.color, TypE.vectory, TypE.playery, TypE.bool, TypE.bool]], ["Arrow: Down", "White", "(0, 0, 0)", "All Players(All Teams)", "False", true])

Class.add("WorldText", ["Create In-World Text(All Players(All Teams), $p$, 1, Clip Against Surfaces, Visible To, Position, And String)", [TypE.string, TypE.vector]])
Class.add("WorldText", ["Create In-World Text($p3$, $p0$, $p1$, $p2$, $p4|Clip Against Surfaces|Do Not Clip$, $p5,p6|Visible To, Position, And String|Visible To And String|Visible To And String|String$)", [TypE.string, TypE.vector, TypE.number, TypE.playery, TypE.bool, TypE.bool, TypE.bool]])
Class.add("WorldText", ["Create In-World Text($p3$, $p0$, $p1$, $p2$, $p4|Clip Against Surfaces|Do Not Clip$, $p5|Visible To, Position, And String|String$)", [TypE.string, TypE.vector, TypE.number, TypE.playery, TypE.bool, TypE.bool]], [(new StringConst()).toString(), "(0, 0, 0)", "0", "All Players(All Teams)", true, true])



Class.add("Effect", ["Play Effect(All Players(All Teams), $p$, 1, None)", [[TypE.shortVisualEffect, TypE.shortAudibleEffect], TypE.color, [TypE.player, TypE.vector]]])
Class.add("Effect", ["Play Effect($p3$, $p0$, $p1$, $p2$, 1, None)", [[TypE.shortVisualEffect, TypE.shortAudibleEffect], TypE.color, [TypE.vector, TypE.player], [TypE.player, new ArrayType(TypE.player)]]])
Class.add("Effect", ["Play Effect($p3$, $p0$, $p1$, $p2$, 1, $p4,p5|VISIBLE TO, POSITION, AND RADIUS|POSITION AND RADIUS|VISIBLE TO|NONE$)", [[TypE.shortVisualEffect, TypE.shortAudibleEffect], TypE.color, [TypE.vector, TypE.player], [TypE.player, new ArrayType(TypE.player)], TypE.bool, TypE.bool]])
//["color.blue", new ConstValue([], "Blue", Type.get(TypE.color))], ["color.green", new ConstValue([], "Green", Type.get(TypE.color))], ["color.purple", new ConstValue([], "Purple", Type.get(TypE.color))], ["color.red", new ConstValue([], "Red", Type.get(TypE.color))], ["color.team1", new ConstValue([], "Team 1", Type.get(TypE.color))], ["color.team2", new ConstValue([], "Team 2", Type.get(TypE.color))], ["color.white", new ConstValue([], "White", Type.get(TypE.color))], ["color.yellow", new ConstValue([], "Yellow", Type.get(TypE.color))],
ConstValue.add("color", ["blue", "green", "purple", "red", "team1", "team2", "white", "yellow"])
ConstValue.add("vfx.l", ["badAura", "cloud", "goodAura", "lightShaft", "orb", "ring", "sparkles", "sphere"], TypE.longVisualEffect)
ConstValue.add("vfx.s", ["badExplosion", "badPickupEffect", "goodExplosion", "goodPickupEffect", "ringExplosion"], TypE.shortVisualEffect)
//ConstValue.add("sfx.l", ["badAura", "cloud", "goodAura", "lightShaft", "orb", "ring", "sparkles", "sphere"], TypE.longAudibleEffect)
ConstValue.add("sfx.s", ["buffExplosion", "buffImpact", "debuffImpact", "explosion", "ringExplosion"], TypE.shortAudibleEffect)
ConstValue.add("side", ["all", "none", "team"], TypE.side)
ConstValue.add("world", TypE.world)
ConstValue.add("button", ["ability1", "ability2", "crouch", "interact", "jump", "primaryFire", "secondaryFire", "ultimate"], TypE.button)
ConstValue.add("hero", ["ana", "ashe", "baptiste", "bastion", "brigitte", ["dva", "D.VA"], "doomfist", "genji", "hanzo", "junkrat", "lúcio", ["lucio", "Lúcio"], "mccree", "mei", "mercy", "moira", "orisa", "pharah", "reaper", "reinhardt", "roadhog", "sigma", ["soldier76", "Soldier: 76"], "sombra", "symmetra", "torbjörn", ["torbjorn", "torbjörn"], "tracer", "widowmaker", "winston", "wreckingBall", "zarya", "zenyatta"], TypE.hero, "Hero($v$)")
ConstValue.add("status", ["asleep", "burning", "frozen", "hacked", "invincible", "knockedDown", "phasedOut", "rooted", "stunned", "unkillable"], TypE.status)
ConstValue.add("communicate", ["acknowledge", ["group", "Group Up"], "hello", ["healing", "Need Healing"], "thanks", ["ultimate", "Ultimate Status"]], TypE.communicate)
ConstValue.add("emote", [["down", "EMOTE DOWN"], ["left", "EMOTE LEFT"], ["right", "EMOTE RIGHT"], ["up", "EMOTE UP"]], TypE.emote)
ConstValue.add("voice", [["down", "VOICE LINE DOWN"], ["left", "VOICE LINE LEFT"], ["right", "VOICE LINE RIGHT"], ["up", "VOICE LINE UP"]], TypE.voiceLine)
ConstValue.add("icon", [["down", "Arrow: Down"], ["left", "Arrow: Left"], ["right", "Arrow: Right"], ["up", "Arrow: Up"], "asterisk", "bolt", "checkmark", "circle", "club", "diamond", "dizzy", ["exclamation", "Exclamation Mark"], "eye", "fire", "flag", "halo", "happy", "heart", "moon", "no", "plus", "poison", "poison2", ["question", "Question Mark"], "radioactive", "recycle", "ringThick", "ringThin", "sad", "skull", "spade", "spiral", "stop", "trashcan", "warning", "x"], TypE.icon)
ConstValue.add("null", TypE.null)