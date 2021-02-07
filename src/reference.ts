import {parser} from '@tamuratak/lezer-grammar'
import * as vscode from 'vscode'
import {Scope} from './scope'

export class ReferenceProvider implements vscode.ReferenceProvider {
    provideReferences(document: vscode.TextDocument, position: vscode.Position) {
        const content = document.getText()
        const wordRange = document.getWordRangeAtPosition(position)
        const word = document.getText(wordRange)
        const offset = document.offsetAt(position)
        const tree = parser.parse(content)
//        console.log(JSON.stringify(tree.children[0].length))
        const scope = Scope.from(content, tree)
        const refs = scope.findRefs({ name: word, pos: offset })
        const ret: vscode.Location[] = []
        for ( const ref of refs ) {
            const start = document.positionAt(ref.from)
            const end = document.positionAt(ref.to)
            const range = new vscode.Range(start, end)
            const loc = new vscode.Location(document.uri, range)
            ret.push(loc)
        }
        return ret
    }
}
