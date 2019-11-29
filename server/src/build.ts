import { Rule, Comment, EventObj, EventType } from './typeUtil';
import * as _ from 'underscore'
import { BoolConst, BoolOp, Comp, cond, ArrayInit } from './types';

export function buildRules(rules: (Rule | Comment)[]): string {
	var text = ""
	if (ArrayInit.constArray.length > 0) { 
		text+= 'rule("Initialisation of constant arrays")\n{\n\tevent\n\t{\n\t\tOngoing - Each Player;\n\t\tAll;\n\t\tAll;\n\t}\n\tactions\n\t{'
		ArrayInit.constArray.forEach((v)=>{ 
			text+="\n\t"+v.toString(true,"\t")
		})
		text+="\n\t}\n}" 
	}  
	rules.forEach(e => {
		if (e instanceof Comment)
			text += e.toString()
		else {
			e.events = e.events.reverse()
			text += "\n" + buildRule(e)
		}
	})

	return text
}
export var localRuleInd = 0;
export function resetLocalRuleInd() {
	localRuleInd = 0
}
function buildRule(rule: Rule): string {
	var text = ""
	text += 'rule("' + rule.name + '")\n{\n\tevent\n\t{\n'

	var ruleb = false
	for (let index = 0; index < rule.events.length && !ruleb; index++) {
		if (rule.events[rule.events.length - 1] instanceof Comment)
			text += "\t\t" + (rule.events.pop() as Comment).toString(false, "\t\t");
		else ruleb = true
	}
	var ev = rule.events.pop() as EventObj || new EventObj(EventType.global)
	text += "\t\t" + buildEvent(ev) + "\t}\n"
	if (rule.conditions.length > 0 && ev) {
		text += "\tconditions\n\t{\n\t\t"
		text += _.map(rule.conditions, e => {
			if (e instanceof BoolConst || e instanceof BoolOp || e instanceof Comp)
				return e.toString(ev.type == EventType.global, "\t\t", true)
			return new Comp([], cond.e, e, new BoolConst([], true)).toString(ev.type == EventType.global, "\t\t", true)
		}).join(";\n\t\t")
		text += ";\n\t}\n"
	}
	if (rule.actions.length > 0 && ev) {
		text += "\tactions\n\t{\n\t\t"
		text += _.map(rule.actions, e => e.toString(ev.type == EventType.global, "\t\t")).join("\n\t\t")
		text += "\n\t}\n"
	}
	text += "}\n"
	return text + (rule.events.length > 0 ? buildRule(rule) : "")
}

function buildEvent(event?: EventObj): string {
	if (event == undefined) return "Ongoing - Global;\n"
	var text: string | undefined
	text = event.type + ";\n"
	switch (event.type) {
		case EventType.global:
			return text
		default:
			return text + "\t\t" + event.team.toString(false, "\t\t", true) + ";\n\t\t" + event.player.toString(false, "\t\t", true) + ";\n"
	}
}

