/* eslint-disable no-console */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    TypeMapper: function() {
        return TypeMapper;
    },
    formatNode: function() {
        return formatNode;
    },
    printNode: function() {
        return printNode;
    }
});
const _extends = require("@swc/helpers/_/_extends");
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _object_without_properties_loose = require("@swc/helpers/_/_object_without_properties_loose");
const _typescript = /*#__PURE__*/ _interop_require_wildcard._(require("typescript"));
const _executorsutils = require("../../executors-utils");
const tsPrinter = _typescript.createPrinter({
    removeComments: true,
    omitTrailingSemicolon: true
});
const prioritisedMembers = [
    'type'
];
let TypeMapper = class TypeMapper {
    entries() {
        return Array.from(this.nodeMap.entries()).sort();
    }
    resolvedEntries() {
        return this.entries().map(([name])=>{
            this.genericsMap = new Map();
            return this.resolveType(name);
        });
    }
    isTopLevelDeclaration(node) {
        return _typescript.isEnumDeclaration(node) || _typescript.isInterfaceDeclaration(node) || _typescript.isTypeAliasDeclaration(node);
    }
    extractInterfaceHeritage(node) {
        var _node_heritageClauses;
        return (_node_heritageClauses = node.heritageClauses) == null ? void 0 : _node_heritageClauses.flatMap((h)=>h.types.map(({ expression, typeArguments })=>typeArguments ? {
                    kind: 'typeRef',
                    type: formatNode(expression),
                    typeArguments: typeArguments.map(formatNode)
                } : formatNode(expression)));
    }
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    resolveType(nameOrNode, typeArguments) {
        if (typeof nameOrNode === 'string') {
            const mapItem = this.nodeMap.get(nameOrNode);
            if (mapItem) {
                return this.resolveNode(mapItem, typeArguments);
            } else {
                console.error('Missing!', nameOrNode);
            }
        } else {
            return this.resolveNode({
                node: nameOrNode
            }, typeArguments);
        }
    }
    resolveNode({ node, heritage = [] }, typeArguments) {
        if (node.typeParams) {
            node.typeParams.map((param, index)=>{
                var _typeArguments_index;
                const value = (_typeArguments_index = typeArguments == null ? void 0 : typeArguments[index]) != null ? _typeArguments_index : param.default;
                if (value && param.name !== value) {
                    this.genericsMap.set(param.name, value);
                }
            });
        }
        if (node.kind === 'indexAccess') {
            const memberName = node.index.replace(/^'(.*)'$/, '$1');
            const { members } = this.resolveType(node.type);
            const { type } = members.find((member)=>member.name === memberName);
            return this.resolveType(type);
        }
        if (node.kind === 'typeAlias') {
            const { kind, type } = node, rest = _object_without_properties_loose._(node, [
                "kind",
                "type"
            ]);
            switch(node.type.kind){
                case 'typeRef':
                    return this.resolveNode({
                        node: _extends._({}, rest, {
                            kind: 'interface',
                            members: []
                        }),
                        heritage: [
                            type
                        ]
                    }, typeArguments);
                case 'typeLiteral':
                    return this.resolveType(_extends._({
                        name: node.name
                    }, node.type));
                case 'intersection':
                    heritage = type.type.filter((subType)=>{
                        if (subType.kind === 'typeLiteral') {
                            return true;
                        }
                        if (subType.kind === 'typeRef') {
                            subType = subType.type;
                        }
                        return !subType.match(/^['{].*['}]$/);
                    });
                    return this.resolveNode({
                        node: _extends._({}, rest, {
                            kind: 'interface',
                            members: []
                        }),
                        heritage
                    }, typeArguments);
            }
        }
        for (const h of heritage){
            var _node;
            var _members;
            (_members = (_node = node).members) != null ? _members : _node.members = [];
            if (typeof h === 'string' || this.nodeMap.has(h.type)) {
                const n = typeof h === 'string' ? this.resolveType(h) : this.resolveType(h.type, h.typeArguments);
                if (Array.isArray(n.members)) {
                    node.members.push(...n.members);
                } else {
                    console.warn('Node heritage without members found', h, n);
                }
            } else if (h.type === 'Omit' || h.type === 'Pick') {
                const n = this.resolveTypeRef(h);
                node.members.push(...n.members);
            } else if (h.type === 'Readonly') {
                const n = this.resolveType({
                    kind: 'typeAlias',
                    type: h.typeArguments[0]
                });
                node.members.push(...n.members);
            } else if (h.kind === 'typeLiteral') {
                node.members.push(...h.members);
            } else {
                console.warn(`Unhandled type "${h.type}" on ${node.name}`, h);
            }
        }
        if (node.members) {
            node.members = this.cleanupMembers(node.members);
        }
        if (this.genericsMap.size) {
            node.genericsMap = Array.from(this.genericsMap).reduce((result, [key, value])=>{
                result[key] = value;
                return result;
            }, {});
        }
        return node;
    }
    resolveTypeRef(node) {
        if (node.type === 'NonNullable') {
            return this.resolveType(node.typeArguments[0]);
        } else if (node.type === 'Omit' || node.type === 'Pick') {
            let typeRef = node.typeArguments[0];
            if (typeof typeRef !== 'string') {
                typeRef = typeRef.type;
            }
            const resolveTypeKeyType = (typeKey)=>{
                if (typeof typeKey === 'string' && !typeKey.match(/^'.*'$/)) {
                    return this.resolveType(typeKey).type;
                } else if ((typeKey == null ? void 0 : typeKey.kind) === 'union') {
                    typeKey.type = typeKey.type.flatMap((t)=>{
                        t = resolveTypeKeyType(t);
                        if (t.kind === 'union') {
                            return t.type;
                        } else {
                            return [
                                t
                            ];
                        }
                    });
                    return typeKey;
                } else {
                    return typeKey;
                }
            };
            const typeKeys = resolveTypeKeyType(node.typeArguments[1]);
            const expectedFilter = node.type === 'Pick';
            const matchType = typeKeys.kind === 'union' ? (m)=>typeKeys.type.includes(`'${m.name}'`) === expectedFilter : (m)=>{
                var _typeKeys_type;
                return ((_typeKeys_type = typeKeys.type) != null ? _typeKeys_type : typeKeys) === `'${m.name}'` === expectedFilter;
            };
            const n = this.resolveType(typeRef);
            return _extends._({}, n, {
                members: n.members.filter(matchType)
            });
        } else {
            return this.resolveType(node.type, node.type.typeArguments);
        }
    }
    cleanupMembers(members) {
        // remove duplicates and push required members to the top of the list
        return members.filter((_param, index)=>{
            var { name } = _param, data = _object_without_properties_loose._(_param, [
                "name"
            ]);
            const firstMatchIndex = members.findIndex((item)=>item.name === name);
            const isFirstAppearance = firstMatchIndex === index;
            if (!isFirstAppearance) {
                var _existingMember;
                const existingMember = members[firstMatchIndex];
                var _docs;
                (_docs = (_existingMember = existingMember).docs) != null ? _docs : _existingMember.docs = data.docs;
            }
            return isFirstAppearance;
        }).filter(({ docs })=>{
            return (docs == null ? void 0 : docs.some((d)=>d.includes('@deprecated'))) !== true;
        }).sort((a, b)=>{
            if (a.optional && !b.optional) return 1;
            if (!a.optional && b.optional) return -1;
            return 0;
        }).sort((a, b)=>{
            if (prioritisedMembers.includes(a.name)) return -1;
            if (prioritisedMembers.includes(b.name)) return 1;
            return 0;
        });
    }
    constructor(inputFiles){
        this.nodeMap = new Map();
        for (const file of inputFiles.flatMap(_executorsutils.inputGlob)){
            (0, _executorsutils.parseFile)(file).forEachChild((node)=>{
                if (this.isTopLevelDeclaration(node)) {
                    const typeNode = {
                        node: formatNode(node)
                    };
                    if (_typescript.isInterfaceDeclaration(node)) {
                        typeNode.heritage = this.extractInterfaceHeritage(node);
                    }
                    this.nodeMap.set(node.name.text, typeNode);
                }
            });
        }
    }
};
function formatNode(node) {
    if (_typescript.isUnionTypeNode(node)) {
        return {
            kind: 'union',
            type: node.types.map(formatNode)
        };
    }
    if (_typescript.isIntersectionTypeNode(node)) {
        return {
            kind: 'intersection',
            type: node.types.map(formatNode)
        };
    }
    if (_typescript.isTypeParameterDeclaration(node)) {
        return {
            kind: 'typeParam',
            name: printNode(node.name),
            constraint: printNode(node.constraint),
            default: printNode(node.default)
        };
    }
    if (_typescript.isFunctionTypeNode(node) || _typescript.isMethodSignature(node)) {
        var _node_parameters, _node_typeParameters;
        return {
            kind: 'function',
            params: (_node_parameters = node.parameters) == null ? void 0 : _node_parameters.map(formatNode),
            typeParams: (_node_typeParameters = node.typeParameters) == null ? void 0 : _node_typeParameters.map(formatNode),
            returnType: formatNode(node.type)
        };
    }
    if (_typescript.isEnumDeclaration(node)) {
        return {
            kind: 'typeAlias',
            name: printNode(node.name),
            type: {
                kind: 'union',
                type: node.members.map((n)=>formatNode(n.initializer))
            }
        };
    }
    if (_typescript.isTemplateLiteralTypeNode(node)) {
        if (node.templateSpans.length === 1) {
            return formatNode(node.templateSpans[0].type);
        }
    }
    if (_typescript.isTypeAliasDeclaration(node)) {
        var _node_typeParameters1;
        return {
            kind: 'typeAlias',
            name: printNode(node.name),
            type: formatNode(node.type),
            typeParams: (_node_typeParameters1 = node.typeParameters) == null ? void 0 : _node_typeParameters1.map(formatNode)
        };
    }
    if (_typescript.isTypeLiteralNode(node)) {
        return {
            kind: 'typeLiteral',
            members: node.members.map((n)=>({
                    kind: 'member',
                    docs: getJsDoc(n),
                    name: printNode(n.name),
                    type: formatNode(n),
                    optional: !!n.questionToken
                }))
        };
    }
    if (_typescript.isInterfaceDeclaration(node)) {
        var _node_typeParameters2;
        return {
            kind: 'interface',
            docs: getJsDoc(node),
            name: formatNode(node.name),
            members: node.members.map((n)=>{
                const memberDocs = getJsDoc(n);
                const matchDefault = memberDocs == null ? void 0 : memberDocs[memberDocs.length - 1].match(/^\s*Default:\s*`([^`]+)`\s*$/);
                let defaultValue;
                if (matchDefault) {
                    defaultValue = matchDefault[1];
                    memberDocs.pop();
                }
                return {
                    kind: 'member',
                    docs: trimArray(memberDocs),
                    name: formatNode(n.name),
                    type: formatNode(n),
                    optional: !!n.questionToken,
                    defaultValue
                };
            }),
            typeParams: (_node_typeParameters2 = node.typeParameters) == null ? void 0 : _node_typeParameters2.map(formatNode)
        };
    }
    if (_typescript.isParenthesizedTypeNode(node) || _typescript.isPropertySignature(node)) {
        return formatNode(node.type);
    }
    if (_typescript.isArrayTypeNode(node)) {
        return {
            kind: 'array',
            type: formatNode(node.elementType)
        };
    }
    if (_typescript.isTupleTypeNode(node)) {
        return {
            kind: 'tuple',
            type: node.elements.map(formatNode)
        };
    }
    if (_typescript.isParameter(node)) {
        return {
            kind: 'param',
            name: printNode(node.name),
            type: formatNode(node.type)
        };
    }
    if (_typescript.isTypeReferenceNode(node)) {
        const nodeType = formatNode(node.typeName);
        if (nodeType === 'Array') {
            return {
                kind: 'array',
                type: node.typeArguments.length === 1 ? formatNode(node.typeArguments[0]) : node.typeArguments.map(formatNode)
            };
        }
        return node.typeArguments ? {
            kind: 'typeRef',
            type: nodeType,
            typeArguments: node.typeArguments.map(formatNode)
        } : nodeType;
    }
    if (_typescript.isIndexedAccessTypeNode(node)) {
        return {
            kind: 'indexAccess',
            type: formatNode(node.objectType),
            index: printNode(node.indexType)
        };
    }
    switch(node.kind){
        case _typescript.SyntaxKind.AnyKeyword:
        case _typescript.SyntaxKind.BooleanKeyword:
        case _typescript.SyntaxKind.Identifier:
        case _typescript.SyntaxKind.LiteralType:
        case _typescript.SyntaxKind.NeverKeyword:
        case _typescript.SyntaxKind.NumberKeyword:
        case _typescript.SyntaxKind.StringKeyword:
        case _typescript.SyntaxKind.StringLiteral:
        case _typescript.SyntaxKind.SymbolKeyword:
        case _typescript.SyntaxKind.TypeOperator:
        case _typescript.SyntaxKind.UndefinedKeyword:
        case _typescript.SyntaxKind.UnknownKeyword:
        case _typescript.SyntaxKind.VoidKeyword:
            return printNode(node);
        case _typescript.SyntaxKind.MappedType:
            const output = printNode(node);
            console.warn('Avoid using MappedType in user facing typings.', output);
            return output;
        default:
            // data structure used for locating and debugging undefined node kinds - uncomment when needed
            // return { _unknown: ts.SyntaxKind[node.kind], _output: printNode(node) };
            throw Error(`Unknown node kind "${_typescript.SyntaxKind[node.kind]}"\n${printNode(node)}`);
    }
}
function getJsDoc(node) {
    var _node_jsDoc;
    return trimArray((_node_jsDoc = node.jsDoc) == null ? void 0 : _node_jsDoc.flatMap((doc)=>doc.getFullText().split('\n').map((line)=>line.replace(/\*\/\s*$/, '').replace(/^\s*(\/\*{1,2}|\*)/, '').trim())));
}
function printNode(node) {
    try {
        return tsPrinter.printNode(_typescript.EmitHint.Unspecified, node, node.getSourceFile()).replace(/\n\s*/g, ' ');
    } catch (e) {
        return null;
    }
}
function trimArray(array) {
    return array == null ? void 0 : array.join('\n').trim().split('\n');
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvdHlwZXMtdXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7IGlucHV0R2xvYiwgcGFyc2VGaWxlIH0gZnJvbSAnLi4vLi4vZXhlY3V0b3JzLXV0aWxzJztcblxudHlwZSBOb2RlVHlwZSA9IGFueTtcbnR5cGUgSGVyaXRhZ2VUeXBlID1cbiAgICB8IHsga2luZD86IHN0cmluZzsgdHlwZTogYW55OyB0eXBlUGFyYW1zOiBhbnlbXTsgdHlwZUFyZ3VtZW50cz86IGFueVtdOyBtZW1iZXJzPzogVHlwaW5nTWFwSXRlbVtdIH1cbiAgICB8IHN0cmluZztcbnR5cGUgVHlwaW5nTWFwSXRlbSA9IHsgbm9kZTogTm9kZVR5cGU7IGhlcml0YWdlPzogSGVyaXRhZ2VUeXBlW10gfTtcblxuY29uc3QgdHNQcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcih7IHJlbW92ZUNvbW1lbnRzOiB0cnVlLCBvbWl0VHJhaWxpbmdTZW1pY29sb246IHRydWUgfSk7XG5cbmNvbnN0IHByaW9yaXRpc2VkTWVtYmVycyA9IFsndHlwZSddO1xuXG5leHBvcnQgY2xhc3MgVHlwZU1hcHBlciB7XG4gICAgcHJvdGVjdGVkIG5vZGVNYXA6IE1hcDxzdHJpbmcsIFR5cGluZ01hcEl0ZW0+ID0gbmV3IE1hcCgpO1xuICAgIHByb3RlY3RlZCBnZW5lcmljc01hcDogTWFwPHN0cmluZywgc3RyaW5nPjtcblxuICAgIGNvbnN0cnVjdG9yKGlucHV0RmlsZXM6IHN0cmluZ1tdKSB7XG4gICAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBpbnB1dEZpbGVzLmZsYXRNYXAoaW5wdXRHbG9iKSkge1xuICAgICAgICAgICAgcGFyc2VGaWxlKGZpbGUpLmZvckVhY2hDaGlsZCgobm9kZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzVG9wTGV2ZWxEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0eXBlTm9kZTogVHlwaW5nTWFwSXRlbSA9IHsgbm9kZTogZm9ybWF0Tm9kZShub2RlKSB9O1xuICAgICAgICAgICAgICAgICAgICBpZiAodHMuaXNJbnRlcmZhY2VEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5vZGUuaGVyaXRhZ2UgPSB0aGlzLmV4dHJhY3RJbnRlcmZhY2VIZXJpdGFnZShub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5vZGVNYXAuc2V0KG5vZGUubmFtZS50ZXh0LCB0eXBlTm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBlbnRyaWVzKCkge1xuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLm5vZGVNYXAuZW50cmllcygpKS5zb3J0KCk7XG4gICAgfVxuXG4gICAgcmVzb2x2ZWRFbnRyaWVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbnRyaWVzKCkubWFwKChbbmFtZV0pID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJpY3NNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlVHlwZShuYW1lKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGlzVG9wTGV2ZWxEZWNsYXJhdGlvbihcbiAgICAgICAgbm9kZTogdHMuTm9kZVxuICAgICk6IG5vZGUgaXMgdHMuRW51bURlY2xhcmF0aW9uIHwgdHMuSW50ZXJmYWNlRGVjbGFyYXRpb24gfCB0cy5UeXBlQWxpYXNEZWNsYXJhdGlvbiB7XG4gICAgICAgIHJldHVybiB0cy5pc0VudW1EZWNsYXJhdGlvbihub2RlKSB8fCB0cy5pc0ludGVyZmFjZURlY2xhcmF0aW9uKG5vZGUpIHx8IHRzLmlzVHlwZUFsaWFzRGVjbGFyYXRpb24obm9kZSk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGV4dHJhY3RJbnRlcmZhY2VIZXJpdGFnZShub2RlOiB0cy5JbnRlcmZhY2VEZWNsYXJhdGlvbikge1xuICAgICAgICByZXR1cm4gbm9kZS5oZXJpdGFnZUNsYXVzZXM/LmZsYXRNYXAoKGgpID0+XG4gICAgICAgICAgICBoLnR5cGVzLm1hcCgoeyBleHByZXNzaW9uLCB0eXBlQXJndW1lbnRzIH0pID0+XG4gICAgICAgICAgICAgICAgdHlwZUFyZ3VtZW50c1xuICAgICAgICAgICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAga2luZDogJ3R5cGVSZWYnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBmb3JtYXROb2RlKGV4cHJlc3Npb24pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlQXJndW1lbnRzOiB0eXBlQXJndW1lbnRzLm1hcChmb3JtYXROb2RlKSxcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIDogZm9ybWF0Tm9kZShleHByZXNzaW9uKVxuICAgICAgICAgICAgKVxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tcmVkdW5kYW50LXR5cGUtY29uc3RpdHVlbnRzXG4gICAgcHJvdGVjdGVkIHJlc29sdmVUeXBlKG5hbWVPck5vZGU6IE5vZGVUeXBlIHwgc3RyaW5nLCB0eXBlQXJndW1lbnRzPzogTm9kZVR5cGVbXSkge1xuICAgICAgICBpZiAodHlwZW9mIG5hbWVPck5vZGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBjb25zdCBtYXBJdGVtID0gdGhpcy5ub2RlTWFwLmdldChuYW1lT3JOb2RlKTtcbiAgICAgICAgICAgIGlmIChtYXBJdGVtKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZU5vZGUobWFwSXRlbSwgdHlwZUFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ01pc3NpbmchJywgbmFtZU9yTm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlTm9kZSh7IG5vZGU6IG5hbWVPck5vZGUgfSwgdHlwZUFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgcmVzb2x2ZU5vZGUoeyBub2RlLCBoZXJpdGFnZSA9IFtdIH06IFR5cGluZ01hcEl0ZW0sIHR5cGVBcmd1bWVudHM/OiBOb2RlVHlwZVtdKSB7XG4gICAgICAgIGlmIChub2RlLnR5cGVQYXJhbXMpIHtcbiAgICAgICAgICAgIG5vZGUudHlwZVBhcmFtcy5tYXAoKHBhcmFtLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gdHlwZUFyZ3VtZW50cz8uW2luZGV4XSA/PyBwYXJhbS5kZWZhdWx0O1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAmJiBwYXJhbS5uYW1lICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdlbmVyaWNzTWFwLnNldChwYXJhbS5uYW1lLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9kZS5raW5kID09PSAnaW5kZXhBY2Nlc3MnKSB7XG4gICAgICAgICAgICBjb25zdCBtZW1iZXJOYW1lID0gbm9kZS5pbmRleC5yZXBsYWNlKC9eJyguKiknJC8sICckMScpO1xuICAgICAgICAgICAgY29uc3QgeyBtZW1iZXJzIH0gPSB0aGlzLnJlc29sdmVUeXBlKG5vZGUudHlwZSk7XG4gICAgICAgICAgICBjb25zdCB7IHR5cGUgfSA9IG1lbWJlcnMuZmluZCgobWVtYmVyKSA9PiBtZW1iZXIubmFtZSA9PT0gbWVtYmVyTmFtZSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlVHlwZSh0eXBlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub2RlLmtpbmQgPT09ICd0eXBlQWxpYXMnKSB7XG4gICAgICAgICAgICBjb25zdCB7IGtpbmQsIHR5cGUsIC4uLnJlc3QgfSA9IG5vZGU7XG4gICAgICAgICAgICBzd2l0Y2ggKG5vZGUudHlwZS5raW5kKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAndHlwZVJlZic6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc29sdmVOb2RlKFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBub2RlOiB7IC4uLnJlc3QsIGtpbmQ6ICdpbnRlcmZhY2UnLCBtZW1iZXJzOiBbXSB9LCBoZXJpdGFnZTogW3R5cGVdIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlQXJndW1lbnRzXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY2FzZSAndHlwZUxpdGVyYWwnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlVHlwZSh7IG5hbWU6IG5vZGUubmFtZSwgLi4ubm9kZS50eXBlIH0pO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2ludGVyc2VjdGlvbic6XG4gICAgICAgICAgICAgICAgICAgIGhlcml0YWdlID0gdHlwZS50eXBlLmZpbHRlcigoc3ViVHlwZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN1YlR5cGUua2luZCA9PT0gJ3R5cGVMaXRlcmFsJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN1YlR5cGUua2luZCA9PT0gJ3R5cGVSZWYnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViVHlwZSA9IHN1YlR5cGUudHlwZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAhc3ViVHlwZS5tYXRjaCgvXlsne10uKlsnfV0kLyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlTm9kZShcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbm9kZTogeyAuLi5yZXN0LCBraW5kOiAnaW50ZXJmYWNlJywgbWVtYmVyczogW10gfSwgaGVyaXRhZ2UgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVBcmd1bWVudHNcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3QgaCBvZiBoZXJpdGFnZSkge1xuICAgICAgICAgICAgbm9kZS5tZW1iZXJzID8/PSBbXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaCA9PT0gJ3N0cmluZycgfHwgdGhpcy5ub2RlTWFwLmhhcyhoLnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbiA9IHR5cGVvZiBoID09PSAnc3RyaW5nJyA/IHRoaXMucmVzb2x2ZVR5cGUoaCkgOiB0aGlzLnJlc29sdmVUeXBlKGgudHlwZSwgaC50eXBlQXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShuLm1lbWJlcnMpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUubWVtYmVycy5wdXNoKC4uLm4ubWVtYmVycyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdOb2RlIGhlcml0YWdlIHdpdGhvdXQgbWVtYmVycyBmb3VuZCcsIGgsIG4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaC50eXBlID09PSAnT21pdCcgfHwgaC50eXBlID09PSAnUGljaycpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuID0gdGhpcy5yZXNvbHZlVHlwZVJlZihoKTtcbiAgICAgICAgICAgICAgICBub2RlLm1lbWJlcnMucHVzaCguLi5uLm1lbWJlcnMpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChoLnR5cGUgPT09ICdSZWFkb25seScpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuID0gdGhpcy5yZXNvbHZlVHlwZSh7IGtpbmQ6ICd0eXBlQWxpYXMnLCB0eXBlOiBoLnR5cGVBcmd1bWVudHNbMF0gfSk7XG4gICAgICAgICAgICAgICAgbm9kZS5tZW1iZXJzLnB1c2goLi4ubi5tZW1iZXJzKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaC5raW5kID09PSAndHlwZUxpdGVyYWwnKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5tZW1iZXJzLnB1c2goLi4uaC5tZW1iZXJzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBVbmhhbmRsZWQgdHlwZSBcIiR7aC50eXBlfVwiIG9uICR7bm9kZS5uYW1lfWAsIGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vZGUubWVtYmVycykge1xuICAgICAgICAgICAgbm9kZS5tZW1iZXJzID0gdGhpcy5jbGVhbnVwTWVtYmVycyhub2RlLm1lbWJlcnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZ2VuZXJpY3NNYXAuc2l6ZSkge1xuICAgICAgICAgICAgbm9kZS5nZW5lcmljc01hcCA9IEFycmF5LmZyb20odGhpcy5nZW5lcmljc01hcCkucmVkdWNlKChyZXN1bHQsIFtrZXksIHZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0sIHt9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCByZXNvbHZlVHlwZVJlZihub2RlKSB7XG4gICAgICAgIGlmIChub2RlLnR5cGUgPT09ICdOb25OdWxsYWJsZScpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc29sdmVUeXBlKG5vZGUudHlwZUFyZ3VtZW50c1swXSk7XG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS50eXBlID09PSAnT21pdCcgfHwgbm9kZS50eXBlID09PSAnUGljaycpIHtcbiAgICAgICAgICAgIGxldCB0eXBlUmVmID0gbm9kZS50eXBlQXJndW1lbnRzWzBdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0eXBlUmVmICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHR5cGVSZWYgPSB0eXBlUmVmLnR5cGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHJlc29sdmVUeXBlS2V5VHlwZSA9ICh0eXBlS2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0eXBlS2V5ID09PSAnc3RyaW5nJyAmJiAhdHlwZUtleS5tYXRjaCgvXicuKickLykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZVR5cGUodHlwZUtleSkudHlwZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVLZXk/LmtpbmQgPT09ICd1bmlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZUtleS50eXBlID0gdHlwZUtleS50eXBlLmZsYXRNYXAoKHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHQgPSByZXNvbHZlVHlwZUtleVR5cGUodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodC5raW5kID09PSAndW5pb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHQudHlwZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFt0XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0eXBlS2V5O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0eXBlS2V5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCB0eXBlS2V5cyA9IHJlc29sdmVUeXBlS2V5VHlwZShub2RlLnR5cGVBcmd1bWVudHNbMV0pO1xuXG4gICAgICAgICAgICBjb25zdCBleHBlY3RlZEZpbHRlciA9IG5vZGUudHlwZSA9PT0gJ1BpY2snO1xuICAgICAgICAgICAgY29uc3QgbWF0Y2hUeXBlID1cbiAgICAgICAgICAgICAgICB0eXBlS2V5cy5raW5kID09PSAndW5pb24nXG4gICAgICAgICAgICAgICAgICAgID8gKG06IGFueSkgPT4gdHlwZUtleXMudHlwZS5pbmNsdWRlcyhgJyR7bS5uYW1lfSdgKSA9PT0gZXhwZWN0ZWRGaWx0ZXJcbiAgICAgICAgICAgICAgICAgICAgOiAobTogYW55KSA9PiAoKHR5cGVLZXlzLnR5cGUgPz8gdHlwZUtleXMpID09PSBgJyR7bS5uYW1lfSdgKSA9PT0gZXhwZWN0ZWRGaWx0ZXI7XG4gICAgICAgICAgICBjb25zdCBuID0gdGhpcy5yZXNvbHZlVHlwZSh0eXBlUmVmKTtcbiAgICAgICAgICAgIHJldHVybiB7IC4uLm4sIG1lbWJlcnM6IG4ubWVtYmVycy5maWx0ZXIobWF0Y2hUeXBlKSB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZVR5cGUobm9kZS50eXBlLCBub2RlLnR5cGUudHlwZUFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbGVhbnVwTWVtYmVycyhtZW1iZXJzKSB7XG4gICAgICAgIC8vIHJlbW92ZSBkdXBsaWNhdGVzIGFuZCBwdXNoIHJlcXVpcmVkIG1lbWJlcnMgdG8gdGhlIHRvcCBvZiB0aGUgbGlzdFxuICAgICAgICByZXR1cm4gbWVtYmVyc1xuICAgICAgICAgICAgLmZpbHRlcigoeyBuYW1lLCAuLi5kYXRhIH0sIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaXJzdE1hdGNoSW5kZXggPSBtZW1iZXJzLmZpbmRJbmRleCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSBuYW1lKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpc0ZpcnN0QXBwZWFyYW5jZSA9IGZpcnN0TWF0Y2hJbmRleCA9PT0gaW5kZXg7XG4gICAgICAgICAgICAgICAgaWYgKCFpc0ZpcnN0QXBwZWFyYW5jZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBleGlzdGluZ01lbWJlciA9IG1lbWJlcnNbZmlyc3RNYXRjaEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgZXhpc3RpbmdNZW1iZXIuZG9jcyA/Pz0gZGF0YS5kb2NzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gaXNGaXJzdEFwcGVhcmFuY2U7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZpbHRlcigoeyBkb2NzIH0pID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZG9jcz8uc29tZSgoZCkgPT4gZC5pbmNsdWRlcygnQGRlcHJlY2F0ZWQnKSkgIT09IHRydWU7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoYS5vcHRpb25hbCAmJiAhYi5vcHRpb25hbCkgcmV0dXJuIDE7XG4gICAgICAgICAgICAgICAgaWYgKCFhLm9wdGlvbmFsICYmIGIub3B0aW9uYWwpIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChwcmlvcml0aXNlZE1lbWJlcnMuaW5jbHVkZXMoYS5uYW1lKSkgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgIGlmIChwcmlvcml0aXNlZE1lbWJlcnMuaW5jbHVkZXMoYi5uYW1lKSkgcmV0dXJuIDE7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXROb2RlKG5vZGU6IHRzLk5vZGUpIHtcbiAgICBpZiAodHMuaXNVbmlvblR5cGVOb2RlKG5vZGUpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBraW5kOiAndW5pb24nLFxuICAgICAgICAgICAgdHlwZTogbm9kZS50eXBlcy5tYXAoZm9ybWF0Tm9kZSksXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHRzLmlzSW50ZXJzZWN0aW9uVHlwZU5vZGUobm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGtpbmQ6ICdpbnRlcnNlY3Rpb24nLFxuICAgICAgICAgICAgdHlwZTogbm9kZS50eXBlcy5tYXAoZm9ybWF0Tm9kZSksXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHRzLmlzVHlwZVBhcmFtZXRlckRlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBraW5kOiAndHlwZVBhcmFtJyxcbiAgICAgICAgICAgIG5hbWU6IHByaW50Tm9kZShub2RlLm5hbWUpLFxuICAgICAgICAgICAgY29uc3RyYWludDogcHJpbnROb2RlKG5vZGUuY29uc3RyYWludCksXG4gICAgICAgICAgICBkZWZhdWx0OiBwcmludE5vZGUobm9kZS5kZWZhdWx0KSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAodHMuaXNGdW5jdGlvblR5cGVOb2RlKG5vZGUpIHx8IHRzLmlzTWV0aG9kU2lnbmF0dXJlKG5vZGUpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBraW5kOiAnZnVuY3Rpb24nLFxuICAgICAgICAgICAgcGFyYW1zOiBub2RlLnBhcmFtZXRlcnM/Lm1hcChmb3JtYXROb2RlKSxcbiAgICAgICAgICAgIHR5cGVQYXJhbXM6IG5vZGUudHlwZVBhcmFtZXRlcnM/Lm1hcChmb3JtYXROb2RlKSxcbiAgICAgICAgICAgIHJldHVyblR5cGU6IGZvcm1hdE5vZGUobm9kZS50eXBlKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAodHMuaXNFbnVtRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGtpbmQ6ICd0eXBlQWxpYXMnLFxuICAgICAgICAgICAgbmFtZTogcHJpbnROb2RlKG5vZGUubmFtZSksXG4gICAgICAgICAgICB0eXBlOiB7XG4gICAgICAgICAgICAgICAga2luZDogJ3VuaW9uJyxcbiAgICAgICAgICAgICAgICB0eXBlOiBub2RlLm1lbWJlcnMubWFwKChuKSA9PiBmb3JtYXROb2RlKG4uaW5pdGlhbGl6ZXIpKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHRzLmlzVGVtcGxhdGVMaXRlcmFsVHlwZU5vZGUobm9kZSkpIHtcbiAgICAgICAgaWYgKG5vZGUudGVtcGxhdGVTcGFucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXROb2RlKG5vZGUudGVtcGxhdGVTcGFuc1swXS50eXBlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0cy5pc1R5cGVBbGlhc0RlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBraW5kOiAndHlwZUFsaWFzJyxcbiAgICAgICAgICAgIG5hbWU6IHByaW50Tm9kZShub2RlLm5hbWUpLFxuICAgICAgICAgICAgdHlwZTogZm9ybWF0Tm9kZShub2RlLnR5cGUpLFxuICAgICAgICAgICAgdHlwZVBhcmFtczogbm9kZS50eXBlUGFyYW1ldGVycz8ubWFwKGZvcm1hdE5vZGUpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmICh0cy5pc1R5cGVMaXRlcmFsTm9kZShub2RlKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAga2luZDogJ3R5cGVMaXRlcmFsJyxcbiAgICAgICAgICAgIG1lbWJlcnM6IG5vZGUubWVtYmVycy5tYXAoKG4pID0+ICh7XG4gICAgICAgICAgICAgICAga2luZDogJ21lbWJlcicsXG4gICAgICAgICAgICAgICAgZG9jczogZ2V0SnNEb2MobiksXG4gICAgICAgICAgICAgICAgbmFtZTogcHJpbnROb2RlKG4ubmFtZSksXG4gICAgICAgICAgICAgICAgdHlwZTogZm9ybWF0Tm9kZShuKSxcbiAgICAgICAgICAgICAgICBvcHRpb25hbDogISFuLnF1ZXN0aW9uVG9rZW4sXG4gICAgICAgICAgICB9KSksXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHRzLmlzSW50ZXJmYWNlRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGtpbmQ6ICdpbnRlcmZhY2UnLFxuICAgICAgICAgICAgZG9jczogZ2V0SnNEb2Mobm9kZSksXG4gICAgICAgICAgICBuYW1lOiBmb3JtYXROb2RlKG5vZGUubmFtZSksXG4gICAgICAgICAgICBtZW1iZXJzOiBub2RlLm1lbWJlcnMubWFwKChuKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWVtYmVyRG9jcyA9IGdldEpzRG9jKG4pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoRGVmYXVsdCA9IG1lbWJlckRvY3M/LlttZW1iZXJEb2NzLmxlbmd0aCAtIDFdLm1hdGNoKC9eXFxzKkRlZmF1bHQ6XFxzKmAoW15gXSspYFxccyokLyk7XG4gICAgICAgICAgICAgICAgbGV0IGRlZmF1bHRWYWx1ZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaERlZmF1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlID0gbWF0Y2hEZWZhdWx0WzFdO1xuICAgICAgICAgICAgICAgICAgICBtZW1iZXJEb2NzLnBvcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBraW5kOiAnbWVtYmVyJyxcbiAgICAgICAgICAgICAgICAgICAgZG9jczogdHJpbUFycmF5KG1lbWJlckRvY3MpLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBmb3JtYXROb2RlKG4ubmFtZSksXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGZvcm1hdE5vZGUobiksXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbmFsOiAhIW4ucXVlc3Rpb25Ub2tlbixcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHR5cGVQYXJhbXM6IG5vZGUudHlwZVBhcmFtZXRlcnM/Lm1hcChmb3JtYXROb2RlKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAodHMuaXNQYXJlbnRoZXNpemVkVHlwZU5vZGUobm9kZSkgfHwgdHMuaXNQcm9wZXJ0eVNpZ25hdHVyZShub2RlKSkge1xuICAgICAgICByZXR1cm4gZm9ybWF0Tm9kZShub2RlLnR5cGUpO1xuICAgIH1cblxuICAgIGlmICh0cy5pc0FycmF5VHlwZU5vZGUobm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGtpbmQ6ICdhcnJheScsXG4gICAgICAgICAgICB0eXBlOiBmb3JtYXROb2RlKG5vZGUuZWxlbWVudFR5cGUpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmICh0cy5pc1R1cGxlVHlwZU5vZGUobm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGtpbmQ6ICd0dXBsZScsXG4gICAgICAgICAgICB0eXBlOiBub2RlLmVsZW1lbnRzLm1hcChmb3JtYXROb2RlKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAodHMuaXNQYXJhbWV0ZXIobm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGtpbmQ6ICdwYXJhbScsXG4gICAgICAgICAgICBuYW1lOiBwcmludE5vZGUobm9kZS5uYW1lKSxcbiAgICAgICAgICAgIHR5cGU6IGZvcm1hdE5vZGUobm9kZS50eXBlKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAodHMuaXNUeXBlUmVmZXJlbmNlTm9kZShub2RlKSkge1xuICAgICAgICBjb25zdCBub2RlVHlwZSA9IGZvcm1hdE5vZGUobm9kZS50eXBlTmFtZSk7XG4gICAgICAgIGlmIChub2RlVHlwZSA9PT0gJ0FycmF5Jykge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBraW5kOiAnYXJyYXknLFxuICAgICAgICAgICAgICAgIHR5cGU6XG4gICAgICAgICAgICAgICAgICAgIG5vZGUudHlwZUFyZ3VtZW50cy5sZW5ndGggPT09IDFcbiAgICAgICAgICAgICAgICAgICAgICAgID8gZm9ybWF0Tm9kZShub2RlLnR5cGVBcmd1bWVudHNbMF0pXG4gICAgICAgICAgICAgICAgICAgICAgICA6IG5vZGUudHlwZUFyZ3VtZW50cy5tYXAoZm9ybWF0Tm9kZSksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBub2RlLnR5cGVBcmd1bWVudHNcbiAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAga2luZDogJ3R5cGVSZWYnLFxuICAgICAgICAgICAgICAgICAgdHlwZTogbm9kZVR5cGUsXG4gICAgICAgICAgICAgICAgICB0eXBlQXJndW1lbnRzOiBub2RlLnR5cGVBcmd1bWVudHMubWFwKGZvcm1hdE5vZGUpLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICA6IG5vZGVUeXBlO1xuICAgIH1cblxuICAgIGlmICh0cy5pc0luZGV4ZWRBY2Nlc3NUeXBlTm9kZShub2RlKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAga2luZDogJ2luZGV4QWNjZXNzJyxcbiAgICAgICAgICAgIHR5cGU6IGZvcm1hdE5vZGUobm9kZS5vYmplY3RUeXBlKSxcbiAgICAgICAgICAgIGluZGV4OiBwcmludE5vZGUobm9kZS5pbmRleFR5cGUpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHN3aXRjaCAobm9kZS5raW5kKSB7XG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5BbnlLZXl3b3JkOlxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQm9vbGVhbktleXdvcmQ6XG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5JZGVudGlmaWVyOlxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuTGl0ZXJhbFR5cGU6XG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5OZXZlcktleXdvcmQ6XG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5OdW1iZXJLZXl3b3JkOlxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuU3RyaW5nS2V5d29yZDpcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlN0cmluZ0xpdGVyYWw6XG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5TeW1ib2xLZXl3b3JkOlxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuVHlwZU9wZXJhdG9yOlxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuVW5kZWZpbmVkS2V5d29yZDpcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlVua25vd25LZXl3b3JkOlxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuVm9pZEtleXdvcmQ6XG4gICAgICAgICAgICByZXR1cm4gcHJpbnROb2RlKG5vZGUpO1xuXG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5NYXBwZWRUeXBlOlxuICAgICAgICAgICAgY29uc3Qgb3V0cHV0ID0gcHJpbnROb2RlKG5vZGUpO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdBdm9pZCB1c2luZyBNYXBwZWRUeXBlIGluIHVzZXIgZmFjaW5nIHR5cGluZ3MuJywgb3V0cHV0KTtcbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIGRhdGEgc3RydWN0dXJlIHVzZWQgZm9yIGxvY2F0aW5nIGFuZCBkZWJ1Z2dpbmcgdW5kZWZpbmVkIG5vZGUga2luZHMgLSB1bmNvbW1lbnQgd2hlbiBuZWVkZWRcbiAgICAgICAgICAgIC8vIHJldHVybiB7IF91bmtub3duOiB0cy5TeW50YXhLaW5kW25vZGUua2luZF0sIF9vdXRwdXQ6IHByaW50Tm9kZShub2RlKSB9O1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoYFVua25vd24gbm9kZSBraW5kIFwiJHt0cy5TeW50YXhLaW5kW25vZGUua2luZF19XCJcXG4ke3ByaW50Tm9kZShub2RlKX1gKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldEpzRG9jKG5vZGU6IHRzLk5vZGUgJiB7IGpzRG9jPzogeyBnZXRGdWxsVGV4dCgpOiBzdHJpbmcgfVtdIH0pIHtcbiAgICByZXR1cm4gdHJpbUFycmF5KFxuICAgICAgICBub2RlLmpzRG9jPy5mbGF0TWFwKChkb2MpID0+XG4gICAgICAgICAgICBkb2NcbiAgICAgICAgICAgICAgICAuZ2V0RnVsbFRleHQoKVxuICAgICAgICAgICAgICAgIC5zcGxpdCgnXFxuJylcbiAgICAgICAgICAgICAgICAubWFwKChsaW5lKSA9PlxuICAgICAgICAgICAgICAgICAgICBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFwqXFwvXFxzKiQvLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9eXFxzKihcXC9cXCp7MSwyfXxcXCopLywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAudHJpbSgpXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICApXG4gICAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByaW50Tm9kZShub2RlOiB0cy5Ob2RlKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHRzUHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIG5vZGUsIG5vZGUuZ2V0U291cmNlRmlsZSgpKS5yZXBsYWNlKC9cXG5cXHMqL2csICcgJyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRyaW1BcnJheShhcnJheT86IHN0cmluZ1tdKTogc3RyaW5nW10ge1xuICAgIHJldHVybiBhcnJheT8uam9pbignXFxuJykudHJpbSgpLnNwbGl0KCdcXG4nKTtcbn1cbiJdLCJuYW1lcyI6WyJUeXBlTWFwcGVyIiwiZm9ybWF0Tm9kZSIsInByaW50Tm9kZSIsInRzUHJpbnRlciIsInRzIiwiY3JlYXRlUHJpbnRlciIsInJlbW92ZUNvbW1lbnRzIiwib21pdFRyYWlsaW5nU2VtaWNvbG9uIiwicHJpb3JpdGlzZWRNZW1iZXJzIiwiZW50cmllcyIsIkFycmF5IiwiZnJvbSIsIm5vZGVNYXAiLCJzb3J0IiwicmVzb2x2ZWRFbnRyaWVzIiwibWFwIiwibmFtZSIsImdlbmVyaWNzTWFwIiwiTWFwIiwicmVzb2x2ZVR5cGUiLCJpc1RvcExldmVsRGVjbGFyYXRpb24iLCJub2RlIiwiaXNFbnVtRGVjbGFyYXRpb24iLCJpc0ludGVyZmFjZURlY2xhcmF0aW9uIiwiaXNUeXBlQWxpYXNEZWNsYXJhdGlvbiIsImV4dHJhY3RJbnRlcmZhY2VIZXJpdGFnZSIsImhlcml0YWdlQ2xhdXNlcyIsImZsYXRNYXAiLCJoIiwidHlwZXMiLCJleHByZXNzaW9uIiwidHlwZUFyZ3VtZW50cyIsImtpbmQiLCJ0eXBlIiwibmFtZU9yTm9kZSIsIm1hcEl0ZW0iLCJnZXQiLCJyZXNvbHZlTm9kZSIsImNvbnNvbGUiLCJlcnJvciIsImhlcml0YWdlIiwidHlwZVBhcmFtcyIsInBhcmFtIiwiaW5kZXgiLCJ2YWx1ZSIsImRlZmF1bHQiLCJzZXQiLCJtZW1iZXJOYW1lIiwicmVwbGFjZSIsIm1lbWJlcnMiLCJmaW5kIiwibWVtYmVyIiwicmVzdCIsImZpbHRlciIsInN1YlR5cGUiLCJtYXRjaCIsImhhcyIsIm4iLCJpc0FycmF5IiwicHVzaCIsIndhcm4iLCJyZXNvbHZlVHlwZVJlZiIsImNsZWFudXBNZW1iZXJzIiwic2l6ZSIsInJlZHVjZSIsInJlc3VsdCIsImtleSIsInR5cGVSZWYiLCJyZXNvbHZlVHlwZUtleVR5cGUiLCJ0eXBlS2V5IiwidCIsInR5cGVLZXlzIiwiZXhwZWN0ZWRGaWx0ZXIiLCJtYXRjaFR5cGUiLCJtIiwiaW5jbHVkZXMiLCJkYXRhIiwiZmlyc3RNYXRjaEluZGV4IiwiZmluZEluZGV4IiwiaXRlbSIsImlzRmlyc3RBcHBlYXJhbmNlIiwiZXhpc3RpbmdNZW1iZXIiLCJkb2NzIiwic29tZSIsImQiLCJhIiwiYiIsIm9wdGlvbmFsIiwiY29uc3RydWN0b3IiLCJpbnB1dEZpbGVzIiwiZmlsZSIsImlucHV0R2xvYiIsInBhcnNlRmlsZSIsImZvckVhY2hDaGlsZCIsInR5cGVOb2RlIiwidGV4dCIsImlzVW5pb25UeXBlTm9kZSIsImlzSW50ZXJzZWN0aW9uVHlwZU5vZGUiLCJpc1R5cGVQYXJhbWV0ZXJEZWNsYXJhdGlvbiIsImNvbnN0cmFpbnQiLCJpc0Z1bmN0aW9uVHlwZU5vZGUiLCJpc01ldGhvZFNpZ25hdHVyZSIsInBhcmFtcyIsInBhcmFtZXRlcnMiLCJ0eXBlUGFyYW1ldGVycyIsInJldHVyblR5cGUiLCJpbml0aWFsaXplciIsImlzVGVtcGxhdGVMaXRlcmFsVHlwZU5vZGUiLCJ0ZW1wbGF0ZVNwYW5zIiwibGVuZ3RoIiwiaXNUeXBlTGl0ZXJhbE5vZGUiLCJnZXRKc0RvYyIsInF1ZXN0aW9uVG9rZW4iLCJtZW1iZXJEb2NzIiwibWF0Y2hEZWZhdWx0IiwiZGVmYXVsdFZhbHVlIiwicG9wIiwidHJpbUFycmF5IiwiaXNQYXJlbnRoZXNpemVkVHlwZU5vZGUiLCJpc1Byb3BlcnR5U2lnbmF0dXJlIiwiaXNBcnJheVR5cGVOb2RlIiwiZWxlbWVudFR5cGUiLCJpc1R1cGxlVHlwZU5vZGUiLCJlbGVtZW50cyIsImlzUGFyYW1ldGVyIiwiaXNUeXBlUmVmZXJlbmNlTm9kZSIsIm5vZGVUeXBlIiwidHlwZU5hbWUiLCJpc0luZGV4ZWRBY2Nlc3NUeXBlTm9kZSIsIm9iamVjdFR5cGUiLCJpbmRleFR5cGUiLCJTeW50YXhLaW5kIiwiQW55S2V5d29yZCIsIkJvb2xlYW5LZXl3b3JkIiwiSWRlbnRpZmllciIsIkxpdGVyYWxUeXBlIiwiTmV2ZXJLZXl3b3JkIiwiTnVtYmVyS2V5d29yZCIsIlN0cmluZ0tleXdvcmQiLCJTdHJpbmdMaXRlcmFsIiwiU3ltYm9sS2V5d29yZCIsIlR5cGVPcGVyYXRvciIsIlVuZGVmaW5lZEtleXdvcmQiLCJVbmtub3duS2V5d29yZCIsIlZvaWRLZXl3b3JkIiwiTWFwcGVkVHlwZSIsIm91dHB1dCIsIkVycm9yIiwianNEb2MiLCJkb2MiLCJnZXRGdWxsVGV4dCIsInNwbGl0IiwibGluZSIsInRyaW0iLCJFbWl0SGludCIsIlVuc3BlY2lmaWVkIiwiZ2V0U291cmNlRmlsZSIsImUiLCJhcnJheSIsImpvaW4iXSwibWFwcGluZ3MiOiJBQUFBLDZCQUE2Qjs7Ozs7Ozs7Ozs7SUFlaEJBLFVBQVU7ZUFBVkE7O0lBbU5HQyxVQUFVO2VBQVZBOztJQW9NQUMsU0FBUztlQUFUQTs7Ozs7O3NFQXJhSTtnQ0FFaUI7QUFRckMsTUFBTUMsWUFBWUMsWUFBR0MsYUFBYSxDQUFDO0lBQUVDLGdCQUFnQjtJQUFNQyx1QkFBdUI7QUFBSztBQUV2RixNQUFNQyxxQkFBcUI7SUFBQztDQUFPO0FBRTVCLElBQUEsQUFBTVIsYUFBTixNQUFNQTtJQWtCVFMsVUFBVTtRQUNOLE9BQU9DLE1BQU1DLElBQUksQ0FBQyxJQUFJLENBQUNDLE9BQU8sQ0FBQ0gsT0FBTyxJQUFJSSxJQUFJO0lBQ2xEO0lBRUFDLGtCQUFrQjtRQUNkLE9BQU8s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