import type * as lezer from 'lezer'

export class Scope {
    private readonly content: string
    private readonly node: lezer.SyntaxNode
    private readonly children: Scope[]
    private readonly ruleDefs: lezer.SyntaxNode[]

    constructor(content: string, node: lezer.SyntaxNode, children: Scope[], ruleDefs: lezer.SyntaxNode[]) {
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
        const rootNode = defNode.parent?.type.isTop ? defNode.parent : defNode
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

function makeTopScope(content: string, curNode: lezer.SyntaxNode): Scope {
    const scopeArray: Scope[] = []
    const ruleDefs: lezer.SyntaxNode[] = []
    let child = curNode.firstChild
    while (child) {
        if (child.name === 'Rule' || child.name === 'RuleSimple') {
            ruleDefs.push(child)
        }
        const scope = makeRuleScope(content, child)
        scopeArray.push(scope)
        child = child.nextSibling
    }
    return new Scope(content, curNode, scopeArray, ruleDefs)
}

function makeRuleScope(content: string, ruleNode: lezer.SyntaxNode): Scope {
    const childScopes: Scope[] = []
    const rules = findRules(ruleNode)
    for( const rule of rules ) {
        const scope = makeRuleScope(content, rule)
        childScopes.push(scope)
    }
    return new Scope(content, ruleNode, childScopes, [ruleNode])
}
