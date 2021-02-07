import type * as lezer from 'lezer'

export class Scope {
    private readonly topNode: lezer.SyntaxNode
    private readonly content: string
    private readonly node: lezer.SyntaxNode
    private readonly children: Scope[]
    private readonly ruleDefs: lezer.SyntaxNode[]

    constructor(topNode: lezer.SyntaxNode, content: string, node: lezer.SyntaxNode, children: Scope[], ruleDefs: lezer.SyntaxNode[]) {
        this.topNode = topNode
        this.content = content
        this.node = node
        this.children = children
        this.ruleDefs = ruleDefs
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
        let rootNode: lezer.SyntaxNode
        if (defNode.parent?.type.isTop || defNode.parent?.name === 'Tokens') {
            rootNode = this.topNode
        } else {
            rootNode = defNode
        }
        const refs = this.findIds(rootNode, node.name, defNode)
        return refs
    }

    findIds(curNode: lezer.SyntaxNode, name: string, defNode: lezer.SyntaxNode): lezer.SyntaxNode[] {
        let ret: lezer.SyntaxNode[] = []
        let child = curNode.firstChild
        let curRuleName: string | undefined
        if ( curNode.name === 'Rule' || curNode.name === 'RuleSimple' ) {
            curRuleName = child ? this.getValue(child) : undefined
            if (curRuleName === name) {
                if (curNode.from !== defNode.from || curNode.to !== defNode.to) {
                    return []
                }
            }
        }
        while (child) {
            if (child.name === 'Identifier' && this.getValue(child) === name) {
                ret.push(child)
            }
            const curRet = this.findIds(child, name, defNode)
            ret = ret.concat(curRet)
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

function makeTopScope(content: string, topNode: lezer.SyntaxNode): Scope {
    const scopeArray: Scope[] = []
    const ruleDefs: lezer.SyntaxNode[] = []
    let child = topNode.firstChild
    while (child) {
        if (child.name === 'Rule' || child.name === 'RuleSimple') {
            ruleDefs.push(child)
        } else if (child.name === 'Tokens') {
            let tok = child.firstChild
            while (tok) {
                if (tok.name === 'Rule' || tok.name === 'RuleSimple') {
                    ruleDefs.push(tok)
                }
                tok = tok.nextSibling
            }
        }
        const scope = makeRuleScope(topNode, content, child)
        scopeArray.push(scope)
        child = child.nextSibling
    }
    return new Scope(topNode, content, topNode, scopeArray, ruleDefs)
}

function makeRuleScope(topNode: lezer.SyntaxNode, content: string, ruleNode: lezer.SyntaxNode): Scope {
    const childScopes: Scope[] = []
    const rules = findRules(ruleNode)
    for( const rule of rules ) {
        const scope = makeRuleScope(topNode, content, rule)
        childScopes.push(scope)
    }
    return new Scope(topNode, content, ruleNode, childScopes, [ruleNode])
}
