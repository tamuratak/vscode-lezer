import * as vscode from 'vscode'
import {DefinitionProvider} from './definition'
import {ReferenceProvider} from './reference'


export function activate(context: vscode.ExtensionContext) {
    console.log('activation')
    context.subscriptions.push(
        vscode.languages.registerReferenceProvider(
            { scheme: 'file', language: 'lezer'},
            new ReferenceProvider()
        ),
        vscode.languages.registerDefinitionProvider(
            { scheme: 'file', language: 'lezer'},
            new DefinitionProvider()
        )
    )
}