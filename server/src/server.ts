/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
	createConnection,
	TextDocuments,
	TextDocument,
	Diagnostic,
	DiagnosticSeverity, InitializeParams,
	ProposedFeatures,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams
} from 'vscode-languageserver';
import * as fs from "fs"
import { findPlayer, parseComment, parseBlockComment, parseRule, parseAir, parseName, variables, resetVars } from './params';
import { buildRules, resetLocalRuleInd } from './build';
import _ = require('underscore');
import { Rule, Comment } from './typeUtil';
import { ArrayConst, ArrayInit } from './types';
// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we will fall back using global settings
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	return {
		capabilities: {
			textDocumentSync: documents.syncKind,
			// Tell the client that the server supports code completion
			completionProvider: {
				resolveProvider: true
			}
		}
	};
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ExampleSettings>(
			(change.settings.languageServerExample || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(e => validateTextDocument(e));
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'languageServerExample'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
let running = false
var document: any = null
documents.onDidChangeContent(async (change) => {
	document = change.document;
	if (running == false) {
		//running = true
		prerun(document)
	}
});

async function prerun(dc: any) {
	document = null
	await validateTextDocument(dc, () => {
		if (document)
			prerun(document)
		else
			running = false
	});
}

function errorAt(start: number, end: number, severity: 1 | 2 | 3 | 4 | undefined, diagnostics: Array<Diagnostic>, document: TextDocument, message: string) {
	let diagnostic: Diagnostic = {
		severity: severity,
		range: {
			start: document.positionAt(start),
			end: document.positionAt(end)
		},
		message: message,
		source: 'overwatch js'
	};
	diagnostics.push(diagnostic);
}

function clearCache() {
	
	resetVars()
	resetLocalRuleInd()
	ArrayConst.index = 0
	ArrayInit.constArray=[]
}

async function validateTextDocument(textDocument: TextDocument, cb: () => void = _.noop): Promise<void> {
	let text = textDocument.getText().replace(/\r\n/g, "\n\n");
	clearCache()
	var rules: (Rule | Comment)[] = []
	let diagnostics: Diagnostic[] = [];
	var i = 0
	var name = ""
	var localInd=0
	//#region functions
	do {
		parseComment(text, (comment, length) => {
			if (comment != null) {
				rules.push(comment)
				i += length
				text = text.substring(length)
			}
		})
		parseAir(text, (length) => {
			text = text.substring(length)
			i += length
		})
		parseName(text, (n, length, error) => {
			name = n
			text = text.substring(length)
			error.forEach((element) => {
				errorAt(i + element.start, i + element.end, element.severity, diagnostics, textDocument, element.message);
			})
			i += length
		})
		parseBlockComment(text, (comment, length, error) => {
			if (comment != null) {
				rules.push(comment)
				i += length
				text = text.substring(length)
			}
		})
		parseRule(text, name, localInd, (rule, n, length, error) => {
			if (rule != null) {
				rules.push(...rule)
			}
			error.forEach(element => {
				errorAt(i + element.start, i + element.end, element.severity, diagnostics, textDocument, element.message);
			});
			i += length
			text = text.substring(length)
			name = n
			localInd=(rule.find((v)=>v instanceof Rule) as Rule).localVars.index
		})
		parseAir(text, (length) => {
			text = text.substring(length)
			i += length
		})
		var m = text.match(/^([^]*?)[\n\s]*(\/\/|\/\*|rule|$)/)
		if (m && m[1].length != 0) {
			let length = m[1].length
			text = text.substring(length)
			errorAt(i, i + length, DiagnosticSeverity.Error, diagnostics, textDocument, '"' + m[1] + '" is not a Comment or Rule.')
			i += length
		}
	} while (text.length > 0);
	//#endregion
	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
	var file = fs.openSync(new URL(textDocument.uri.replace(/(?<=\/)[^/]*?$/, (substring) => { return substring.replace(/[^.]*$/, "json") })), "w")
	var rulesC: Object[] = []

	rules.forEach(rule => {
		if (rule instanceof Rule)
			rulesC.push({ name: rule.name, events: rule.events, conditions: rule.conditions, actions: rule.actions, localVars: strMapToObj(rule.localVars) })
		else
			rulesC.push(rule)
	})
	fs.write(file, JSON.stringify({ rules: rulesC, globalVars: strMapToObj(variables) }, null, "\t"), () => { })

	fs.open(new URL(textDocument.uri.replace(/(?<=\/)[^/]*?$/, (substring) => { return substring.replace(/[^.]*$/, "ows") })), "w", (error, file) => {
		if (error) return
		fs.write(file, buildRules(rules), () => { })
	})
	await delay(500)
	cb()
}
function delay(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
function strMapToObj(strMap: Map<string, Object>) {
	let obj = Object.create(null);
	for (let [k, v] of strMap) {
		// We don’t escape the key '__proto__'
		// which can cause problems on older engines
		obj[k] = v;
	}
	return obj;
}

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		return [
			{
				label: 'TypeScript',
				kind: CompletionItemKind.Text,
				data: 1
			},
			{
				label: 'JavaScript',
				kind: CompletionItemKind.Text,
				data: 2
			}
		];
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			item.detail = 'TypeScript details';
			item.documentation = 'TypeScript documentation';
		} else if (item.data === 2) {
			item.detail = 'JavaScript details';
			item.documentation = 'JavaScript documentation';
		}
		return item;
	}
);

/*
connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.text the initial full content of the document.
	connection.console.log(`${params.textDocument.uri} opened.`);
});
connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});
connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.uri uniquely identifies the document.
	connection.console.log(`${params.textDocument.uri} closed.`);
});
*/

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
