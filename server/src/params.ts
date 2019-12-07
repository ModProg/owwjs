import { PlayerE, TypE, Value, TeamConst, PlayerConst, BoolConst, Variable, Type } from './types';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { Action } from './actions';
import { splitWP, findParan } from './helper';
import { SynErr, VariableBlock, BlockComment, Comment, EventObj, EventType, Rule } from './typeUtil';
import _ = require('underscore');

export function findPlayer(text: string, position: number): { value: PlayerE, text: string, position: number } {
	let match = /^[(,]/
	return { value: PlayerE.all, text: text, position: position }

}
export const variables = new VariableBlock()
export function resetVars() {
	variables.clear()
	Type.get(TypE.player).props.clear()
}
export function parseComment(text: string, cb: (comment: Comment, length: number) => void) {

	let match = /^\/\/.*?(?=[\n\r]|$)/.exec(text)
	if (match != null) {
		cb(new Comment(match[0].substring(2)), match[0].length)
	}
}

export function parseBlockComment(text: string, cb: (comment: Comment | null, length: number, error: SynErr[]) => void) {
	let match = /^\/\*[\n\r\s]*([^]*?)[\s\n\r]*(?<end>\*\/|$)/.exec(text)
	if (match && match.groups) {
		if (match.groups.end.length > 1)
			cb(new BlockComment(match[1]), match[0].length, [])
		else cb(null, match.length, [new SynErr(0, Number.MAX_SAFE_INTEGER, DiagnosticSeverity.Error, "Blockcomment not closed")])
	}
}

export function parseName(text: string, cb: (name: string, length: number, error: SynErr[]) => void) {
	let match = /^(?<beginning>\/\*\*[\n\r\s]*)(?<name>[^]*?)[\n\r\s]*\*\//.exec(text)
	if (match != null && match.groups) {
		if (match.groups.name.length > 128)
			return cb(match.groups.name.substr(0, 128), match[0].length, [new SynErr(match.groups.beginning.length + 128, match.groups.beginning.length + match.groups.name.length, DiagnosticSeverity.Warning, '"' + match.groups.name + '" is longer than 128 characters.')])
		cb(match.groups.name, match[0].length, [])
	}
}

export function parseAir(text: string, cb: (length: number) => void) {
	let match = /^[\n\r\s]*/.exec(text)
	if (match != null)
		cb(match[0].length)
}




function parseParams(text: string, types: (Type | TypE | TypE[] | Type[]), cb: (values: Value[], errors: SynErr[]) => void, global?: VariableBlock, local?: VariableBlock, ) {
	let params = splitWP(text, /,/, undefined, "()", "[]")
	let values: Value[] = []
	let errors: SynErr[] = []
	var length = 0
	let comms: Comment[] = []

	let f = (value: Type, index: number = 0, param?: string, ) => {
		if (param == undefined)
			if (index < params.length)
				param = params[index]
			else
				param = ""
		let gist = param.replace(/\/\/(.*?)$/mg, (a, b) => {
			comms.push(new Comment(b))
			return ""
		}).replace(/\/\*[\n\r]*([^]*?)[\n\r]*\*\//g, (a, b) => {
			comms.push(new BlockComment(b))
			return ""
		}).replace(/[\s\r\n]/g, "")
		if (gist == "" && !(types instanceof Array)) return
		switch (value.name) {
			case TypE.teamConst:

				gist = gist.replace(/[\s\r\n]/g, "")
				let team = TeamConst.parse(gist)

				if (team != null) {
					team.comments = comms
					values.push(team)
				}
				else {
					values.push(new TeamConst(comms, undefined))
					errors.push(new SynErr(length, length + param.length, DiagnosticSeverity.Error, "'" + param.replace(/[\s\r\n]/g, "") + "'" + " is not a valid Team Constant"))
				}
				length += param.length + 1
				break;
			case TypE.playerConst:
				gist = gist.replace(/[\s\r\n]/g, "")
				let player = PlayerConst.parse(gist)
				if (player != null) {
					player.comments = comms
					values.push(player)
				}
				else {
					values.push(new PlayerConst(comms, undefined))
					errors.push(new SynErr(length, length + param.length, DiagnosticSeverity.Error, "'" + gist + "'" + " is not a valid PlayerConst"))

				}
				length += param.length + 1
				break;
			case TypE.bool:
				var boolVal: Value | null = null
				if (global)
					boolVal = Value.parse(gist, global, local)
				if (boolVal) {
					boolVal.comments = comms
					values.push(boolVal)
				} else {
					values.push(new BoolConst(comms, false))
					errors.push(new SynErr(length, length + param.length, DiagnosticSeverity.Error, "'" + gist + "'" + " is not a valid Boolean"))
				}
				length += param.length + 1
				break
			default:
				break;
		}
	}
	if (types instanceof Array)
		if (types[0] instanceof Type)
			(types as Type[]).forEach((v: Type, i: number) => f(v, i))
		else
			(types as TypE[]).forEach((v, i) => f(Type.get(v), i))
	else
		params.forEach(v => f(Type.as(types), 0, v))
	cb(values, errors)
}





function parseEvent(text: string, cb: (event: EventObj | null, length: number, errors: SynErr[]) => void) {
	let match = /^([\p{Alphabetic}_][\p{Alphabetic}_\p{Decimal_Number}]*)([\s\r\n]*\()([^]*?)\)/u.exec(text)
	if (match == null) {
		if (/^(\/\/|\s|,|;|\/\*)/.exec(text))
			return
		else cb(null, 1, [])
		return
	}
	var errors: SynErr[] = []
	var event: EventObj | undefined
	switch (match[1]) {
		case "global":
			if (!/^[\s\n\r]*$/.test(match[3]))
				errors.push(new SynErr(match[1].length + match[2].length + 1, match[0].length, DiagnosticSeverity.Warning, "This should be empty..."))
			event = new EventObj()
			break;
		default:
			if (Object.keys(EventType).includes(match[1])) {
				event = new EventObj((<any>EventType)[match[1]])
				parseParams(match[3], [TypE.teamConst, TypE.playerConst], (values, es) => {

					if (event) {
						event.team = values[0] as TeamConst
						event.player = values[1] as PlayerConst
					}
					es.forEach(e => {
						if (match != null) {
							e.start += match[1].length + match[2].length + 1
							e.end += match[1].length + match[2].length + 1
						}
						errors.push(e)
					})
				})

			}
	}

	if (event != undefined)
		cb(event, match[0].length, errors)
	else {
		errors.push(new SynErr(0, 0 + match[0].length, DiagnosticSeverity.Error, "'" + match[0].replace(/[\s\r\n]/g, "") + "'" + " is not a valid Event"))
		cb(null, match[0].length, errors)

	}
}

function parseEvents(text: string, cb: (events: (EventObj | Comment)[], length: number, error: SynErr[]) => void) {
	if (!text.startsWith("[")) return
	var end = findParan(text, "[]")
	text = text.substring(1, end)
	var i = 0
	var events: (EventObj | Comment)[] = []
	var allErrors: SynErr[] = []
	do {
		parseAir(text, (l) => {
			i += l
			text = text.substr(l)
		})
		parseComment(text, (comment, length) => {
			if (comment != null) {
				events.push(comment)
				i += length
				text = text.substring(length)
			}
		})
		parseBlockComment(text, (comment, length, errors) => {
			if (comment)
				events.push(comment)
			errors.forEach((value) => {
				value.start += i
				value.end += i
			})
			allErrors.push(...errors)
			i += length
			text = text.substring(length)

		})
		if (/^(,|;)/.test(text)) {
			i += 1
			text = text.substring(1)
		}
		parseEvent(text, (event, length, errors) => {
			if (event)
				events.push(event)
			errors.forEach((value) => {
				value.start += i
				value.end += i
			})
			allErrors.push(...errors)
			i += length
			text = text.substring(length)
		})
	} while (text.length > 0);

	cb(events, end + 1, allErrors)
}

function parseCondition(text: string, cb: (conditions: BoolConst[], length: number, error: SynErr[]) => void) {
	if (!text.startsWith("(")) return
	var end = findParan(text, "()")
	if (end < 0) return cb([], -1, [new SynErr(0, -1, DiagnosticSeverity.Error, "Condition opened, but not closed.")])
	text = text.substring(1, end)
	var i = 0
	parseParams(text, TypE.bool, (values, errors) => {
		errors.forEach(value => {
			value.start++
			value.end++
		})
		cb(values as BoolConst[], end + 1, errors)
	}, variables)
}

export function parseRule(text: string, name: string, localInd = 0, cb: (rule: (Rule | Comment)[], name: string, length: number, error: SynErr[]) => void) {
	let match = /^(rule)([^]*?)(rule|$)/.exec(text)
	if (match == null) return
	var ruleString = match[2]
	var i = match[1].length
	var rule = new Rule(name);
	var rules: (Rule | Comment)[] = []
	var comments: Comment[] = []
	var allErrors: SynErr[] = []
	var vars = new VariableBlock()
	vars.index = localInd
	do {
		parseComment(ruleString, (comment, length) => {
			if (comment != null) {
				comments.push(comment)
				i += length
				ruleString = ruleString.substring(length)
			}
		})
		parseName(ruleString, (n, length, errors) => {
			name = n
			errors.forEach((value) => {
				value.start += i
				value.end += i
			})
			i += length
			ruleString = ruleString.substring(length)
			allErrors.push(...errors)
		})
		parseBlockComment(ruleString, (comment, length, errors) => {
			if (comment != null) {
				comments.push(comment)
				errors.forEach((value) => {
					value.start += i
					value.end += i
				})
				i += length
				ruleString = ruleString.substring(length)
				allErrors.push(...errors)

			}
		})

		parseEvents(ruleString, (events, length, errors) => {
			rule.events.push(...events)
			ruleString = ruleString.substring(length)
			errors.forEach((value) => {
				value.start += i
				value.end += i
			})
			allErrors.push(...errors)
			i += length
			rules.push(...comments)
			comments = []
		})
		parseCondition(ruleString, (boolVal, length, errors) => {
			if (length < 0) {
				errors[0].start += i
				i += ruleString.length - 1
				errors[0].end = ruleString.length - 1
				ruleString = ""
				return
			}
			rule.conditions.push(...boolVal)
			ruleString = ruleString.substring(length)
			errors.forEach((value) => {
				value.start += i
				value.end += i
			})
			allErrors.push(...errors)
			i += length
			rules.push(...comments)
			comments = []
		})
		if (ruleString.startsWith("{")) {
			let end = findParan(ruleString, "{}")
			let acs = Action.parseMultiple(ruleString.substring(1, end), vars, variables);
			end += 2
			rule.actions.push(...acs.actions)
			ruleString = ruleString.substring(end)
			allErrors.push(..._.map(acs.errors, (v) => v.add(i + 1)))
			i += end
			rules.push(...comments)
			comments = []

		}
		parseAir(ruleString, (l) => {
			i += l
			ruleString = ruleString.substr(l)
		})
		var m = ruleString.match(/^([^]*?)[\n\s]*(\/\/|\/\*|\[|{|\(|$)/)
		if (m && m[1].length != 0) {
			let length = m[1].length
			ruleString = ruleString.substring(length)
			allErrors.push(new SynErr(i, i + length, DiagnosticSeverity.Error, '"' + m[1] + '" is not a Condition, Action, Event or Rule.'))
			i += length
		}
	} while (ruleString.length > 0)
	rule.localVars = vars
	rules.push(rule)
	rules.push(...comments)
	cb(rules, name, i, allErrors);
}