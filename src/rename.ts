import {parser} from '@tamuratak/lezer-grammar'
import * as vscode from 'vscode'
import {Scope} from './scope'

export class RenameProvider implements vscode.RenameProvider {
    provideRenameEdits(document: vscode.TextDocument, position: vscode.Position, newName: string) {
        const content = document.getText()
        const wordRange = document.getWordRangeAtPosition(position)
        const word = document.getText(wordRange)
        const offset = document.offsetAt(position)
        const tree = parser.parse(content)
        const scope = Scope.from(content, tree)
        const refs = scope.findRefs({ name: word, pos: offset })
        const edit = new vscode.WorkspaceEdit()
        for ( const ref of refs ) {
            const start = document.positionAt(ref.from)
            const end = document.positionAt(ref.to)
            const range = new vscode.Range(start, end)
            edit.replace(document.uri, range, newName)
        }
        return edit
    }
}
