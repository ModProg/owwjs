import { Variable, PlayerConst, TeamConst, Value, Prop, VarProp } from './types';
import _ = require('underscore');
import { Action } from './actions';
import { DiagnosticSeverity } from 'vscode-languageserver';

export class VariableBlock extends Map<string, Variable>{
	constructor() {
		super()
	}

	temps: (string | [string, Variable])[] = []

	temp(name?: string, variable?: Variable | null) {
		if (name)
			if (variable) {
				if (this.has(name))
					this.temps.push([name, this.get(name) as Variable])
				else
					this.temps.push(name)
				this.set(name, variable)
			}
			else {
				let i1 = _.findLastIndex(this.temps, (e) => e == name)
				let i2 = _.findLastIndex(this.temps, (v) => v[0] == name)
				if (i1 > i2) {
					this.delete(name)
					this.temps.splice(i1)
				}
				else if (i2 > 0) {
					this.set(name, this.temps[i2][1] as Variable)
					this.temps.splice(i2)
				}

			}
		else {
			this.temps.reverse().forEach((v) => {
				if (typeof v == "string")
					this.delete(v)
				else this.set(v[0], v[1])
			})
			this.temps = []
		}
	}

	index: number = 0

	inc() {
		return this.index++
	}

	clear() {
		super.clear()
		this.index = 0
	}

}

export class Properties extends Map<string, typeof Prop | Variable>{
	vars: Map<string, Variable> = new Map();
	private props: Map<string, typeof Prop> = new Map();
	private arrayProps: Map<string, typeof Prop> = new Map();

	get array() {
		return new Properties(this.arrayProps)
	}

	constructor(props?: Map<string, typeof Prop>, arrayProps?: Map<string, typeof Prop>, vars?: Map<string, Variable>) {
		super()
		this.vars = vars || new Map
		this.props = props || new Map
		this.arrayProps = arrayProps || new Map
	}
	index = 0;
	clear() {
		this.vars.clear()
		this.index = 0
	}
	var = (key: string) => VarProp.get(this.vars.get(key))

	get(key: string, array = false): typeof Prop | undefined {
		return array ? this.arrayProps.get(key) || this.var(key) : this.props.get(key) || this.var(key)
	}
	add(prop: Variable) {
		if (prop.pointer = -1)
			prop.pointer = this.index++;
		this.vars.set(prop.name, prop)
	}
}

export class SynErr {
	start = 0
	end = 0
	severity: 1 | 2 | 3 | 4 | undefined;
	message = "";
	constructor(start?: number, end?: number, severity?: (1 | 2 | 3 | 4 | undefined), message?: string) {
		this.start = start || this.start
		this.end = end || this.end
		this.severity = severity || this.severity
		this.message = message || this.message
	}

	add(i: number): SynErr {
		this.start += i
		this.end += i
		return this
	}
}


export class Comment {
	block = false
	text: string
	rows = 0
	constructor(text: string) {
		this.text = text.replace(/^\s*|\s*$/g, "")
	}

	static parse(text: string): null | { comment: Comment, length: number } {

		let match = /^\/\/.*?(?=[\n\r]|$)/.exec(text)
		if (match)
			return { comment: new Comment(match[0].substring(2)), length: match[0].length }
		return BlockComment.parse(text)
	}


	toString(global?: boolean, indent = "") {
		if (this.block)
			return "/*\n" + indent + _.map(this.text.split(/\n/g), (e) => e.replace(/^\s*/, "\t")).join("\n" + indent) + "\n" + indent + "*/"
		else
			return "// " + this.text
	}
}

export class BlockComment extends Comment {
	block = true

	static parse(text: string): { comment: Comment, length: number } | null {
		let match = /^\/\*[\n\r\s]*([^]*?)[\s\n\r]*(?<end>\*\/|$)/.exec(text)
		if (match && match.groups) {
			if (match.groups.end.length > 1)
				return { comment: new BlockComment(match[1]), length: match[0].length }
			else throw { length: match[0].length, error: new SynErr(0, Number.MAX_SAFE_INTEGER, DiagnosticSeverity.Error, "Blockcomment not closed") }
		}
		return null
	}
}

export enum EventType {
	global = "Ongoing - Global", player = "Ongoing - Each Player", dealtDamage = "Player Dealt Damage", finalBlow = "Player Dealt Final Blow", healed = "Player Dealt Healing", died = "Player Died", elimed = "Player Earned Elimination", joined = "Player Joined Match", left = "Player Left Match", gotHealed = "Player Recieved Healing", tookDamage = "Player Took Damage"
}

export class EventObj {
	constructor(type: EventType = EventType.global, player?: PlayerConst, team?: TeamConst) {
		this.type = type
		this.player = player || this.player
		this.team = team || this.team
	}
	type: EventType
	player = new PlayerConst()
	team = new TeamConst()
}


export class Rule {
	constructor(name: string) {
		this.name = name;
	}
	name: string
	events: (EventObj | Comment)[] = []
	conditions: (Value)[] = []
	actions: (Action | Comment)[] = []
	comment = false
	localVars = new VariableBlock();
}