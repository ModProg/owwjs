import { Value, NumConst, Type, Variable, TypE, BoolOp, boolOp, Prop, PropType } from './types';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { localRuleInd } from './build';
import _ = require('underscore');
import { VariableBlock, SynErr, Comment, BlockComment } from './typeUtil';
import { findParan, findEnd, splitWP, splitWPToken } from './helper';

export interface Action {
	disabled: boolean
	toString(g: boolean, ...args: any[]): string
}

export class Action {
	disabled = false
	comments: Comment[] = []
	public get rows(): number {
		return 1
	}
	/*
		throws: {error:SynErr, length:1}
	*/
	static parse(text: string, local: VariableBlock, global: VariableBlock, disabled = false): { action: Action | null, length: number, errors: SynErr[] } | null {
		if (text.length == 0 || /^(\/\/|\/\*)/.test(text))
			return null
		var errors: SynErr[] = []
		var action: Action | undefined
		if (text.startsWith(";"))
			return { action: null, length: 1, errors: [] }
		if (text.startsWith("}"))
			throw { error: new SynErr(0, 1, DiagnosticSeverity.Error, '"}" was not expected'), length: 1 }

		let lines = text.split("\n")
		let line = lines.shift() as string
		let lwoc = (v: string) => v.replace(/\/\/[^]*?($|\n)|\*\/[^](\*\/|$)|\s*/g, "")
		while (lines.length > 0 && (/(["',+\-*/\^&=|]|\bglobal)\s*$/.test(lwoc(line)) || /^\s*["',+\-*/\^&=|]/.test(lwoc((_.find(lines, (v, i, list) => /^\S/.test(lwoc(v)) || list.length - 1 == i) as string))))) {
			line += "\n" + lines.shift()
		}
		let ass: { action: Action | null; length: number; errors: SynErr[]; } | null = null // f(text.split(/[;}]|$/, 1)[0] || "")
		let comms: { comment: Comment; length: number; }[] = []
		try {
			let t = line.replace(/(\/\/[^]*?(\n|$))|(\/\*[^]*?\*\/)/g, (a) => {
				let c = Comment.parse(a) as { comment: Comment; length: number; }
				comms.push(c)
				return a.substr(c.length)
			}).split(/([;]|\/\/|\/\*)(?=[^}]*$)/, 1)[0] || ""
			ass = Modify.parse(t, local, global) || Assignment.parse(t, local, global, !disabled) || Function.parse(t, local, global)
		} catch (e) {
			if (e.error)
				error = e
			throw e

		}
		if (ass) {
			comms.forEach((v) => {
				if (ass) {
					ass.length += v.length
					if (ass.action)
						ass.action.comments.push(v.comment)
				}
			})
		}
		if (!ass)
			try {
				ass = IF.parse(text, local, global)
			} catch (e) {
				if (e.error)
					error = e
				throw e
			}
		var error

		if (!ass) {
			if (error)
				throw error

		}
		if (ass && ass.action)
			ass.action.disabled = disabled
		return ass
	}

	static parseMultiple(text: string, local: VariableBlock, global: VariableBlock): { actions: (Action | Comment)[], errors: SynErr[] } {


		var i = 0
		var actions: (Action | Comment)[] = []
		var allErrors: SynErr[] = []
		do {
			var b = false
			do {
				b = false
				try {
					let comment = Comment.parse(text);
					if (comment) {
						var acc = null
						try {
							acc = Action.parse(comment.comment.text.replace(/^\s*/, ""), local, global, true)
						} catch (error) { }
						if (acc && acc.action)
							actions.push(acc.action)
						else
							actions.push(comment.comment)
						i += comment.length
						text = text.substring(comment.length)
						b = true
					}
				} catch (e) {
					if (!e.error) throw e
					allErrors.push(e.error.add(i))
					i += e.length
					text = text.substring(e.length)
				}
				let m = /^(,|;|\s|\n)+/.exec(text)
				if (m) {
					i += m[0].length
					text = text.substring(m[0].length)
					b = true
				}
				try {
					var ac = Action.parse(text, local, global)
					if (ac) {
						text = text.substring(ac.length)
						if (ac.action != null)
							actions.push(ac.action)
						allErrors.push(..._.map(ac.errors, e => e.add(i)))
						i += ac.length
						b = true
					}
				} catch (error) {
					if (!error.error)
						throw error
					allErrors.push(error.error.add(i))
					i += error.length
					text = text.substring(error.length)
				}
			} while (b)
			let m = /^[\p{Alphabetic}_0-9.()]+/u.exec(text)
			if (m) {
				allErrors.push(new SynErr(i, m[0].length + i, DiagnosticSeverity.Error, '"' + m[0] + '" is not a valid Action'))
				i += m[0].length
				text = text.substring(m[0].length)
			} else {
				let s = text.split("\n", 1)[0]
				if (s.length > 0 && text.length > 0) {
					allErrors.push(new SynErr(i, i + s.length, DiagnosticSeverity.Error, '"' + s + '" expected Action name'))
					i += s.length
					text = text.substring(s.length)
				}
			}
		} while (text.length > 0);

		return { actions: actions, errors: allErrors }
	}
	toString(g: boolean = true, indent = ""): string {
		if (this.comments.length > 0)
			return _.map(this.comments, (v) => v.toString(g, indent)).join("\n" + indent) + "\n" + indent
		else return ""
	}
}

export class Assignment extends Action {
	value: Value = new NumConst()
	global = true
	index: number | string | Prop

	public get rows(): number {
		let a = this.value.getArray()
		if (a instanceof Array)
			return _.reduce(a, (a: number, b) => a + b.rows, 1)
		else return 1 + a.rows
	}

	constructor(value: Value, index: string | number | Prop = 0, global = false) {
		super()
		this.value = value
		this.global = global
		this.index = index
	}
	/*
		throws: {error:SynErr, length:1}
	*/
	static parse(text: string, local: VariableBlock, global: VariableBlock, dec = true): { action: Action | null, length: number, errors: SynErr[] } | null {
		let match = /^(?<dec>(?<pretype>(?<global>global|local)?[\s\n]*(?<name>[\p{Alphabetic}_][\p{Alphabetic}_0-9]*))(:(?<type>([\p{Alphabetic}_][\p{Alphabetic}_0-9]*)?(\[\])*))?)((?<eq>[\s\n]*=[\s\n]*)(?<value>\S[^]*?)[\s]*)?[\s]*?($)/u.exec(text)
		if (match != null && match.groups != null) {
			let name = match.groups.name
			let access = match.groups.global
			var type
			if (match.groups.type)
				try {
					type = Type.parse(match.groups.type)
				} catch (error) {
					if (!(error instanceof SynErr)) throw error
					error.start += match.groups.pretype.length + (error.end == 0 ? 0 : 1)
					error.end += match.groups.pretype.length + 1
					throw { error: error, length: match[0].length }
				}
			else type = Type.get(TypE.undefined)
			if (!type.saveAble)
				throw { error: new SynErr(match.groups.pretype.length, match.groups.dec.length, DiagnosticSeverity.Error, 'Cannot declare ' + type + ' variable, as it is not saveable'), length: match[0].length }
			if (dec) {
				if (access == "global")
					if (local.has(name))
						throw { error: new SynErr(0, match.groups.dec.length, DiagnosticSeverity.Error, 'Cannot declare global variable "' + name + '" if already declared localy.'), length: match[0].length }
					else if (global.has(name))
						throw { error: new SynErr(0, match.groups.dec.length, DiagnosticSeverity.Error, 'Cannot declare global variable "' + name + '" if already declared globaly.'), length: match[0].length }
					else
						global.set(name, new Variable({ pointer: global.inc(), name: name, type: type }))

				else
					if (access == "local")
						if (local.has(name))
							throw { error: new SynErr(0, match.groups.dec.length, DiagnosticSeverity.Error, 'Cannot declare local variable "' + name + '" if already declared localy.'), length: match[0].length }
						else
							local.set(name, new Variable({ pointer: local.inc(), name: name, type: type, local: true }))
			}
			if (!(local.has(name) || global.has(name)))
				return null
			if (match.groups.value == undefined) return { action: null, length: match[0].length, errors: [] }
			let val: Value | null
			let t = local.get(name)
			let g = false
			if (t == undefined) {
				t = global.get(name)
				g = true
			}
			if (t == undefined)
				throw { error: new SynErr(0, match.groups.dec.length, DiagnosticSeverity.Error, 'Cannot assign undeclared variable "' + name + '".'), length: match[0].length }
			if (t.type.name != TypE.undefined)
				val = Value.parse(match.groups.value, global, local, t.type)
			else {
				val = Value.parse(match.groups.value, global, local)
				if (val != null)
					if (!val.type.saveAble)
						throw { error: new SynErr(match.groups.pretype.length, match.groups.dec.length, DiagnosticSeverity.Error, 'Cannot assign ' + val.type + ' value, as it is not saveable'), length: match[0].length }
					else
						t.type = val.type
			}
			if (val == null) throw { length: match[0].length, error: new SynErr(match.groups.dec.length + match.groups.eq.length, match.groups.dec.length + match.groups.eq.length + match.groups.value.length, DiagnosticSeverity.Error, '"' + match.groups.value + '" is not a valid ' + (t.type.name == TypE.undefined ? 'value.' : t.toString(g) + ".")) }
			return { action: new Assignment(val, t.pointer, g), length: match[0].length, errors: [] }
		}
		let split = splitWP(text, /=/, 2)
		if (split.length > 0) {
			if (split[0].length > 0) {
				let prop = Prop.parse(split[0], global, local, TypE.undefined, PropType.set)
				if (prop) {
					if (split.length > 1) {
						let val = Value.parse(split[1], global, local, prop.types)
						if (val) {
							return { action: new Assignment(val, prop, false), length: text.length, errors: [] }
						}
					}
				} else {
					let split2 = splitWP(split[0], /\./)
					let vs = split2.slice(0, split2.length - 1).join(".")
					let val = Value.parse(vs, global, local, TypE.playery)
					let ts = splitWP(split2[split2.length - 1], /:/)
					if (val && /^\s*[\p{Alphabetic}_][\p{Alphabetic}_0-9]*\s*$/u.test(ts[0]))
						if (ts.length <= 2) {
							if (ts.length == 2) {
								try {
									type = Type.parse(ts[1])
								} catch (error) {
									if (!(error instanceof SynErr))
										throw error
									error.start += vs.length + ts[0].length + 1 + (error.end == 0 ? 0 : 1)
									error.end += vs.length + ts[0].length + 1 + 1
									throw { error: error, length: text.length }
								}
							}
							if (split.length > 1) {
								let value = Value.parse(split[1], global, local, type)
								if (value) {
									if (!type)
										type = value.type
									//playerVariables.set(ts[0].replace(/\s*/g, ""), new Variable(type, playerVariables.inc(), ts[0], false))
									Type.get(TypE.player).props.add(new Variable(type, -1, ts[0].replace(/\s*/g, ""), false))
									// Type.get(TypE.player).props.add(ts[0].replace(/\s*/g, ""), new Variable(type, -1, ts[0], false))
									return { action: new Assignment(value, Prop.parse(vs + "." + ts[0], global, local, undefined, PropType.set) as Prop, false), length: text.length, errors: [] }
								}
							} else {
								if (type) {
									Type.get(TypE.player).props.add(new Variable(type, -1, ts[0].replace(/\s*/g, ""), false))
									// addPlayerVar(ts[0].replace(/\s*/g, ""), new Variable(type, playerVariables.inc(), ts[0], false), Type.get(TypE.player).props)
									// playerVariables.set(ts[0], new Variable(type, playerVariables.inc(), ts[0], false))
									return { action: null, length: text.length, errors: [] }
								}
							}
						}
				}
			}
		}
		return null
	}

	toString(g: boolean = true, indent = "", s = false) {
		if (s) return super.toString()
		let a = this.value.getArray()
		var v = ""
		if (a instanceof Array)
			a.forEach((e) => {
				if (e.toString() != "")
					v += (this.disabled ? "disabled " : "") + e.toString() + "\n" + indent
			})
		else if (a.toString() != "")
			v = a.toString(g, indent) + "\n" + indent
		let prestring = super.toString(g, indent) + v + (this.disabled ? "disabled " : "")
		if (!(this.index instanceof Prop))
			return prestring + "Set " + (g || this.global ? "Global" : "Player") + " Variable At Index(" + (g || this.global ? "" : "Event Player, ") + (this.global ? "A, " + this.index : "B, " + (this.index as number + localRuleInd)) + ", " + this.value.toString(g) + ");"
		return prestring + this.index.toString(g, indent, this.value)
	}
}

export class Modify extends Assignment {
	operation: string

	constructor(value: Value, index: string | number | Prop = 0, global = false, operation: string = "") {
		super(value, index, global)
		this.operation = operation
	}

	/*
		throws: {error:SynErr, length:1}
	*/
	static parse(text: string, local: VariableBlock, global: VariableBlock): { action: Action | null, length: number, errors: SynErr[] } | null {
		let match = /^(?<all>(?<preval>(?<name>[\p{Alphabetic}_][\p{Alphabetic}_0-9]*)\s*(?<op>[+\-*/])\s*=\s*)(?<value>\S[^]*?))[\s]*($)/u.exec(text)
		if (match != null && match.groups != null) {
			let name = match.groups.name
			if (!(local.has(name) || global.has(name)))
				return null
			let val: Value | null
			let t = local.get(name)
			let g = false
			if (t == undefined) {
				t = global.get(name)
				g = true
			}
			if (t == undefined)
				throw { error: new SynErr(0, match.groups.name.length, DiagnosticSeverity.Error, 'Cannot modify undeclared variable "' + name + '".'), length: match[0].length }
			if (t.type.name == TypE.undefined)
				throw { error: new SynErr(0, match.groups.all.length, DiagnosticSeverity.Error, 'Cannot modify unknown type of variable "' + name + '".'), length: match[0].length }

			if (t.type.modifiers.includes(match.groups.op)) {
				val = Value.parse(match.groups.value, global, local, t.type)
				if (val == null)
					throw { error: new SynErr(match.groups.preval.length, match.groups.all.length, DiagnosticSeverity.Error, 'Cannot assign "' + match.groups.value + '" to ' + t.type), length: match[0].length }
				return { action: new Modify(val, t.pointer, g, match.groups.op), length: match[0].length, errors: [] }
			}
			val = Value.parse(name + match.groups.op + match.groups.value, global, local, t.type)
			if (val == null)
				throw { error: new SynErr(match.groups.preval.length, match.groups.all.length, DiagnosticSeverity.Error, 'Cannot assign "' + match.groups.value + '" to ' + t.type), length: match[0].length }
			return { action: new Assignment(val, t.pointer, g), length: match[0].length, errors: [] }
		}
		let split = splitWPToken(text, /(?<target>[+\-*/\^%])\s*=/, 3)
		if (split.length > 2) {
			let prop = Prop.parse(split[0], global, local, TypE.undefined, PropType.sm)
			if (prop?.modifier) {
				if (prop.modifiers.includes(split[1])) {
					let val = Value.parse(split[2], global, local, prop.type)
					if (val)
						return { action: new Modify(val, prop, false, split[1]), errors: [], length: text.length }
				}
				if (split[1] == "-" && prop.modifiers.includes("+")) {
					let val = Value.parse("(-1)*" + split[2], global, local, prop.type)
					if (val)
						return { action: new Modify(val, prop, false, "+"), errors: [], length: text.length }
				}
			}
			if (prop?.setter && prop?.getter) {
				let val = Value.parse(split.join(""), global, local, prop.type)
				if (val) {
					return { action: new Assignment(val, prop, false), length: text.length, errors: [] }
				}
			}
		}
		return null
	}

	toString(g: boolean = true, indent = "", s = false) {
		if (s) return super.toString(g, indent, s)
		let a = this.value.getArray()
		var v = ""
		if (a instanceof Array)
			a.forEach((e) => {
				if (e.toString() != "")
					v += (this.disabled ? "disabled " : "") + e.toString() + "\n" + indent
			})
		else if (a.toString() != "")
			v = a.toString(g, indent) + "\n" + indent
		let prestring = super.toString(g, indent, true) + v + (this.disabled ? "disabled " : "")
		if (!(this.index instanceof Prop))
			return prestring + "Modify " + (g || this.global ? "Global" : "Player") + " Variable At Index(" + (this.global ? "A, " + this.index : "B, " + (this.index as number + localRuleInd)) + ", " + this.value.type.op(this.operation) + ", " + this.value.toString(g) + ");"
		//	Modify Global Variable At Index(A, 0, Append To Array, Event Player);
		return prestring + this.index.toString(g, indent, this.value, this.operation)
	}
}

export class Function extends Action {

	public get rows(): number {
		return _.has(this.value, "lines") ? (<any>this.value).lines : 1
	}

	value: Value

	constructor(value: Value) {
		super()
		this.value = value
	}
	/*
		throws: {error:SynErr, length:1}
	*/
	static parse(text: string, local: VariableBlock, global: VariableBlock): { action: Action | null, length: number, errors: SynErr[] } | null {
		if (/^[\s\n]*$/.test(text))
			return null
		var m = /([^]*?)([;}]|$)/.exec(text)
		let e = findEnd(text, /[;}]|$/)
		var val = Value.parse(text.substring(0, e), global, local)
		if (val && val.value instanceof Variable && val.value.type == val.type)
			return { action: new Assignment(val, val.value.pointer, val.value.global), length: e, errors: [] }
		if (val && val.value instanceof Array && val.value[0] instanceof Variable && val.value[0].type == val.type)
			return { action: new Assignment(val, val.value[0].pointer, val.value[0].global), length: e, errors: [] }
		if (val)
			return { action: new Function(val), length: e, errors: [] }



		return null
	}

	toString(g: boolean, indent = "") {
		return super.toString(g, indent) + (this.disabled ? "disabled " : "") + this.value.toString(g, indent) + ";"
	}
}

export class IF extends Action {
	condition: Value
	ifActions: (Action | Comment)[]
	elActions: (Action | Comment)[]

	constructor(condition: Value, ifActions: (Action | Comment)[], elActions: (Action | Comment)[]) {
		super()
		this.condition = condition
		this.ifActions = ifActions
		this.elActions = elActions
	}

	public get rows(): number {
		let sum = 1
		this.ifActions.forEach((v) => { if (v instanceof Action) sum += v.rows })
		if (this.elActions.length > 0) {
			sum++
			this.elActions.forEach((v) => { if (v instanceof Action) sum += v.rows })
		}
		return sum
	}
	/*
			throws: {error:SynErr, length:1}
	*/
	static parse(text: string, local: VariableBlock, global: VariableBlock): null | { action: Action | null, length: number, errors: SynErr[] } {
		if (/^if\W/.test(text)) {
			//Condition
			let start = text.indexOf("(")
			let endL = start + findParan(text.substring(start), "()")
			start++
			if (endL > start) {
				var bool = Value.parse(text.substring(start, endL), global, local, TypE.bool)
				if (bool) {
					//Body
					start = text.indexOf("{", endL)
					let end = start + findParan(text.substring(start), "{}")
					start++
					let ifActions = Action.parseMultiple(text.substring(start, end), local, global)
					if (ifActions && end > 0) {
						ifActions.errors.forEach(e => e.add(start))
						let b = true
						let elActions = []
						let endElse = end + 1
						while (b) {
							let m = /^(;|\s|\n)+/.exec(text.substring(endElse))
							if (m) {
								endElse += m[0].length
							}
							let c = Comment.parse(text.substring(endElse))
							if (c) {
								elActions.push(c.comment)
								endElse += c.length
							} else b = false
						}
						let m = /^(;|\s|\n)+/.exec(text.substring(endElse))
						if (m) {
							endElse += m[0].length
						}
						if (/^else\W/.test(text.substr(endElse))) {
							start = text.indexOf("{", end)
							let endElse = start + findParan(text.substring(start), "{}")
							let l = Action.parseMultiple(text.substring(start + 1, endElse), local, global)
							l.actions.unshift(...elActions)
							if (elActions && endElse > 0)
								return { action: new IF(bool, ifActions.actions, l.actions), length: endElse + 1, errors: [...ifActions.errors, ..._.map(l.errors, e => e.add(start + 1))] }
							else return { action: null, length: end + 1, errors: [new SynErr(0, end, undefined, "Missing Actions on else Statement")] }
						}

						return { action: new IF(bool, ifActions.actions, []), length: end + 1, errors: ifActions.errors }
					}
					else return { action: null, length: endL + 1, errors: [new SynErr(0, endL, undefined, "Missing Actions on if Statement")] }
				}
			}
		}
		return null
	}


	toString(g: boolean, indent = "") {
		if (this.disabled) {
			this.ifActions.forEach((v) => {
				if (v instanceof Action)
					v.disabled = this.disabled
			})
			this.elActions.forEach((v) => {
				if (v instanceof Action)
					v.disabled = this.disabled
			})
		}
		let indent2 = indent + "\t"
		if (this.elActions.length == 0)
			return (this.disabled ? "disabled" : "") + "Skip If(" + new BoolOp(undefined, boolOp.not, [this.condition]).toString(g) + ", " + _.reduce(this.ifActions, (a: number, v) => a + v.rows, 0) + ");\n" + indent2 + _.map(this.ifActions, (v) => v.toString(g, indent2)).join("\n" + indent2)
		return (this.disabled ? "disabled" : "") + "Skip If(" + new BoolOp(undefined, boolOp.not, [this.condition]).toString(g) + ", " + _.reduce(this.ifActions, (a: number, v) => a + v.rows, 1) + ");\n" + indent2 + _.map(this.ifActions, (v) => v.toString(g, indent2)).join("\n" + indent2) +
			(this.disabled ? "disabled" : "") + "\n" + indent + "Skip(" + _.reduce(this.elActions, (a: number, v) => a + v.rows, 0) + ");\n" + indent2 + _.map(this.elActions, (v) => v.toString(g, indent2)).join("\n" + indent2)
	}
}

//Überprüfe ob die Belegungen sich unterscheiden
