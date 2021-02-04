import {parser} from '@tamuratak/lezer-grammar'
import * as vscode from 'vscode'
import {Scope} from './scope'

export class DefinitionProvider implements vscode.DefinitionProvider {

    provideDefinition(document: vscode.TextDocument, position: vscode.Position) {
        const content = document.getText()
        const wordRange = document.getWordRangeAtPosition(position)
        const word = document.getText(wordRange)
        const offset = document.offsetAt(position)
        const tree = parser.parse(content)
        const scope = Scope.from(content, tree)
        const def = scope.findDef({ name: word, pos: offset })
        if (def) {
            const start = document.positionAt(def.from)
            const end = document.positionAt(def.to)
            const range = new vscode.Range(start, end)
            const loc = new vscode.Location(document.uri, range)
            return [loc]
        }
        return []
    }

}
