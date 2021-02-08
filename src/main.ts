import * as vscode from 'vscode'
import {DefinitionProvider} from './definition'
import {ReferenceProvider} from './reference'
import {RenameProvider} from './rename'


export function activate(context: vscode.ExtensionContext) {
    console.log('Lezer language support activated.')
    context.subscriptions.push(
        vscode.languages.registerReferenceProvider(
            { scheme: 'file', language: 'lezer'},
            new ReferenceProvider()
        ),
        vscode.languages.registerDefinitionProvider(
            { scheme: 'file', language: 'lezer'},
            new DefinitionProvider()
        ),
        vscode.languages.registerRenameProvider(
            { scheme: 'file', language: 'lezer'},
            new RenameProvider()
        )
    )
}
