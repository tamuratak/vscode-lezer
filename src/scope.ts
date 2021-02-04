import type * as lezer from 'lezer'

export class Scope {
    private readonly content: string
    private readonly node: lezer.SyntaxNode
    private readonly children: Scope[]
    private readonly ruleDefs: lezer.SyntaxNode[]

    constructor(content: string, node: lezer.SyntaxNode, children: Scope[], variables: lezer.SyntaxNode[]) {
        this.content = content
        this.node = node
        this.children = children
        this.ruleDefs = variables
    }

    findDef(node: { name: string, pos: number }): lezer.SyntaxNode | undefined{
        for (const scope of this.children) {
            const ret = scope.findDef(node)
            if (ret) {
                return ret
            }
        }
        for (const ruleDef of this.ruleDefs) {
            if (this.node.type.isTop || (this.node.from <= node.pos && node.pos < this.node.to)) {
                const idNode = ruleDef.firstChild
                if (idNode?.name === 'Identifier' && this.getValue(idNode) === node.name) {
                    return ruleDef
                }
            }
        }
        return
    }

    findRefs(node: { name: string, pos: number }): lezer.SyntaxNode[] {
        const defNode = this.findDef(node)
        if (!defNode){
            return []
        }
        const rootNode = defNode.parent
        if (rootNode) {
            return this.findIds(rootNode, node.name)
        }
        return []
    }

    findIds(rootNode: lezer.SyntaxNode, name: string): lezer.SyntaxNode[] {
        let ret: lezer.SyntaxNode[] = []
        let child = rootNode.firstChild
        let curRuleName: string | undefined
        while (child) {
            if ( child.name === 'Identifier' && this.getValue(child) === name ) {
                curRuleName = curRuleName || child.name
                if ( rootNode.name !== 'Rule' && rootNode.name !== 'RuleSimple' ) {
                    ret.push(child)
                }
            } else {
                if (
                    (rootNode.name !== 'Rule' && rootNode.name !== 'RuleSimple') ||
                    curRuleName !== name
                ) {
                    const curRet = this.findIds(child, name)
                    ret = ret.concat(curRet)
                }
            }
            child = child.nextSibling
        }
        return ret
    }

    private getValue(node: { from: number, to: number}) {
        return this.content.substring(node.from, node.to)
    }

    static from(content: string, tree: lezer.Tree): Scope {
        return makeTopScope(content, tree.topNode)
    }
}


function findRules(curNode: lezer.SyntaxNode): lezer.SyntaxNode[] {
    let result: lezer.SyntaxNode[] = []
    let child = curNode.firstChild
    while (child) {
        if (child.name === 'Rule' || child.name === 'RuleSimple') {
            result.push(child)
        }
        const rules = findRules(child)
        result = result.concat(rules)
        child = child.nextSibling
    }
    return result
}

function makeTopScope(content: string, curNode: lezer.SyntaxNode): Scope {
    const scopeArray: Scope[] = []
    const ruleDefs: lezer.SyntaxNode[] = []
    let child = curNode.firstChild
    while (child) {
        if (child.name === 'Rule' || child.name === 'RuleSimple') {
            ruleDefs.push(child)
        }
        const scope = makeScope(content, child)
        scopeArray.push(scope)
        child = child.nextSibling
    }
    return new Scope(content, curNode, scopeArray, ruleDefs)
}

function makeScope(content: string, ruleNode: lezer.SyntaxNode): Scope {
    const scopeArray: Scope[] = []
    const rules = findRules(ruleNode)
    for( const rule of rules ) {
        const scope = makeScope(content, rule)
        scopeArray.push(scope)
    }
    return new Scope(content, ruleNode, scopeArray, [ruleNode])
}
