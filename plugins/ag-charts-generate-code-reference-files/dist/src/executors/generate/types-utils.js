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
            const [typeRef, typeKeys] = node.typeArguments;
            const matchType = typeKeys.kind === 'union' ? (m)=>typeKeys.type.includes(`'${m.name}'`) : (m)=>{
                var _typeKeys_type;
                return ((_typeKeys_type = typeKeys.type) != null ? _typeKeys_type : typeKeys) === `'${m.name}'`;
            };
            const n = this.resolveType(typeof typeRef === 'string' ? typeRef : typeRef.type);
            return _extends._({}, n, {
                members: n.members.filter(node.type === 'Pick' ? matchType : (m)=>!matchType(m))
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
        }).sort((a, b)=>a.optional && !b.optional ? 1 : !a.optional && b.optional ? -1 : 0).sort((a, b)=>prioritisedMembers.includes(a.name) ? -1 : prioritisedMembers.includes(b.name) ? 1 : 0);
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
                type: node.members.map((node)=>formatNode(node.initializer))
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
            members: node.members.map((node)=>({
                    kind: 'member',
                    docs: getJsDoc(node),
                    name: printNode(node.name),
                    type: formatNode(node),
                    optional: !!node.questionToken
                }))
        };
    }
    if (_typescript.isInterfaceDeclaration(node)) {
        var _node_typeParameters2;
        return {
            kind: 'interface',
            docs: getJsDoc(node),
            name: formatNode(node.name),
            members: node.members.map((node)=>{
                const memberDocs = getJsDoc(node);
                const matchDefault = memberDocs == null ? void 0 : memberDocs[memberDocs.length - 1].match(/^\s*Default:\s*`([^`]+)`\s*$/);
                let defaultValue;
                if (matchDefault) {
                    defaultValue = matchDefault[1];
                    memberDocs.pop();
                }
                return {
                    kind: 'member',
                    docs: trimArray(memberDocs),
                    name: formatNode(node.name),
                    type: formatNode(node),
                    optional: !!node.questionToken,
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvdHlwZXMtdXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7IGlucHV0R2xvYiwgcGFyc2VGaWxlIH0gZnJvbSAnLi4vLi4vZXhlY3V0b3JzLXV0aWxzJztcblxudHlwZSBOb2RlVHlwZSA9IGFueTtcbnR5cGUgSGVyaXRhZ2VUeXBlID1cbiAgICB8IHsga2luZD86IHN0cmluZzsgdHlwZTogYW55OyB0eXBlUGFyYW1zOiBhbnlbXTsgdHlwZUFyZ3VtZW50cz86IGFueVtdOyBtZW1iZXJzPzogVHlwaW5nTWFwSXRlbVtdIH1cbiAgICB8IHN0cmluZztcbnR5cGUgVHlwaW5nTWFwSXRlbSA9IHsgbm9kZTogTm9kZVR5cGU7IGhlcml0YWdlPzogSGVyaXRhZ2VUeXBlW10gfTtcblxuY29uc3QgdHNQcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcih7IHJlbW92ZUNvbW1lbnRzOiB0cnVlLCBvbWl0VHJhaWxpbmdTZW1pY29sb246IHRydWUgfSk7XG5cbmNvbnN0IHByaW9yaXRpc2VkTWVtYmVycyA9IFsndHlwZSddO1xuXG5leHBvcnQgY2xhc3MgVHlwZU1hcHBlciB7XG4gICAgcHJvdGVjdGVkIG5vZGVNYXA6IE1hcDxzdHJpbmcsIFR5cGluZ01hcEl0ZW0+ID0gbmV3IE1hcCgpO1xuICAgIHByb3RlY3RlZCBnZW5lcmljc01hcDogTWFwPHN0cmluZywgc3RyaW5nPjtcblxuICAgIGNvbnN0cnVjdG9yKGlucHV0RmlsZXM6IHN0cmluZ1tdKSB7XG4gICAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBpbnB1dEZpbGVzLmZsYXRNYXAoaW5wdXRHbG9iKSkge1xuICAgICAgICAgICAgcGFyc2VGaWxlKGZpbGUpLmZvckVhY2hDaGlsZCgobm9kZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzVG9wTGV2ZWxEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0eXBlTm9kZTogVHlwaW5nTWFwSXRlbSA9IHsgbm9kZTogZm9ybWF0Tm9kZShub2RlKSB9O1xuICAgICAgICAgICAgICAgICAgICBpZiAodHMuaXNJbnRlcmZhY2VEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5vZGUuaGVyaXRhZ2UgPSB0aGlzLmV4dHJhY3RJbnRlcmZhY2VIZXJpdGFnZShub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5vZGVNYXAuc2V0KG5vZGUubmFtZS50ZXh0LCB0eXBlTm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBlbnRyaWVzKCkge1xuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLm5vZGVNYXAuZW50cmllcygpKS5zb3J0KCk7XG4gICAgfVxuXG4gICAgcmVzb2x2ZWRFbnRyaWVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbnRyaWVzKCkubWFwKChbbmFtZV0pID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJpY3NNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlVHlwZShuYW1lKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGlzVG9wTGV2ZWxEZWNsYXJhdGlvbihcbiAgICAgICAgbm9kZTogdHMuTm9kZVxuICAgICk6IG5vZGUgaXMgdHMuRW51bURlY2xhcmF0aW9uIHwgdHMuSW50ZXJmYWNlRGVjbGFyYXRpb24gfCB0cy5UeXBlQWxpYXNEZWNsYXJhdGlvbiB7XG4gICAgICAgIHJldHVybiB0cy5pc0VudW1EZWNsYXJhdGlvbihub2RlKSB8fCB0cy5pc0ludGVyZmFjZURlY2xhcmF0aW9uKG5vZGUpIHx8IHRzLmlzVHlwZUFsaWFzRGVjbGFyYXRpb24obm9kZSk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGV4dHJhY3RJbnRlcmZhY2VIZXJpdGFnZShub2RlOiB0cy5JbnRlcmZhY2VEZWNsYXJhdGlvbikge1xuICAgICAgICByZXR1cm4gbm9kZS5oZXJpdGFnZUNsYXVzZXM/LmZsYXRNYXAoKGgpID0+XG4gICAgICAgICAgICBoLnR5cGVzLm1hcCgoeyBleHByZXNzaW9uLCB0eXBlQXJndW1lbnRzIH0pID0+XG4gICAgICAgICAgICAgICAgdHlwZUFyZ3VtZW50c1xuICAgICAgICAgICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAga2luZDogJ3R5cGVSZWYnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBmb3JtYXROb2RlKGV4cHJlc3Npb24pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlQXJndW1lbnRzOiB0eXBlQXJndW1lbnRzLm1hcChmb3JtYXROb2RlKSxcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIDogZm9ybWF0Tm9kZShleHByZXNzaW9uKVxuICAgICAgICAgICAgKVxuICAgICAgICApO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCByZXNvbHZlVHlwZShuYW1lT3JOb2RlOiBOb2RlVHlwZSB8IHN0cmluZywgdHlwZUFyZ3VtZW50cz86IE5vZGVUeXBlW10pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lT3JOb2RlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uc3QgbWFwSXRlbSA9IHRoaXMubm9kZU1hcC5nZXQobmFtZU9yTm9kZSk7XG4gICAgICAgICAgICBpZiAobWFwSXRlbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc29sdmVOb2RlKG1hcEl0ZW0sIHR5cGVBcmd1bWVudHMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdNaXNzaW5nIScsIG5hbWVPck5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZU5vZGUoeyBub2RlOiBuYW1lT3JOb2RlIH0sIHR5cGVBcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHJlc29sdmVOb2RlKHsgbm9kZSwgaGVyaXRhZ2UgPSBbXSB9OiBUeXBpbmdNYXBJdGVtLCB0eXBlQXJndW1lbnRzPzogTm9kZVR5cGVbXSkge1xuICAgICAgICBpZiAobm9kZS50eXBlUGFyYW1zKSB7XG4gICAgICAgICAgICBub2RlLnR5cGVQYXJhbXMubWFwKChwYXJhbSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHR5cGVBcmd1bWVudHM/LltpbmRleF0gPz8gcGFyYW0uZGVmYXVsdDtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgJiYgcGFyYW0ubmFtZSAhPT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZW5lcmljc01hcC5zZXQocGFyYW0ubmFtZSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vZGUua2luZCA9PT0gJ2luZGV4QWNjZXNzJykge1xuICAgICAgICAgICAgY29uc3QgbWVtYmVyTmFtZSA9IG5vZGUuaW5kZXgucmVwbGFjZSgvXicoLiopJyQvLCAnJDEnKTtcbiAgICAgICAgICAgIGNvbnN0IHsgbWVtYmVycyB9ID0gdGhpcy5yZXNvbHZlVHlwZShub2RlLnR5cGUpO1xuICAgICAgICAgICAgY29uc3QgeyB0eXBlIH0gPSBtZW1iZXJzLmZpbmQoKG1lbWJlcikgPT4gbWVtYmVyLm5hbWUgPT09IG1lbWJlck5hbWUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZVR5cGUodHlwZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9kZS5raW5kID09PSAndHlwZUFsaWFzJykge1xuICAgICAgICAgICAgY29uc3QgeyBraW5kLCB0eXBlLCAuLi5yZXN0IH0gPSBub2RlO1xuICAgICAgICAgICAgc3dpdGNoIChub2RlLnR5cGUua2luZCkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3R5cGVSZWYnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlTm9kZShcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbm9kZTogeyAuLi5yZXN0LCBraW5kOiAnaW50ZXJmYWNlJywgbWVtYmVyczogW10gfSwgaGVyaXRhZ2U6IFt0eXBlXSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZUFyZ3VtZW50c1xuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3R5cGVMaXRlcmFsJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZVR5cGUoeyBuYW1lOiBub2RlLm5hbWUsIC4uLm5vZGUudHlwZSB9KTtcbiAgICAgICAgICAgICAgICBjYXNlICdpbnRlcnNlY3Rpb24nOlxuICAgICAgICAgICAgICAgICAgICBoZXJpdGFnZSA9IHR5cGUudHlwZS5maWx0ZXIoKHN1YlR5cGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdWJUeXBlLmtpbmQgPT09ICd0eXBlTGl0ZXJhbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdWJUeXBlLmtpbmQgPT09ICd0eXBlUmVmJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YlR5cGUgPSBzdWJUeXBlLnR5cGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gIXN1YlR5cGUubWF0Y2goL15bJ3tdLipbJ31dJC8pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZU5vZGUoXG4gICAgICAgICAgICAgICAgICAgICAgICB7IG5vZGU6IHsgLi4ucmVzdCwga2luZDogJ2ludGVyZmFjZScsIG1lbWJlcnM6IFtdIH0sIGhlcml0YWdlIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlQXJndW1lbnRzXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IGggb2YgaGVyaXRhZ2UpIHtcbiAgICAgICAgICAgIG5vZGUubWVtYmVycyA/Pz0gW107XG4gICAgICAgICAgICBpZiAodHlwZW9mIGggPT09ICdzdHJpbmcnIHx8IHRoaXMubm9kZU1hcC5oYXMoaC50eXBlKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG4gPSB0eXBlb2YgaCA9PT0gJ3N0cmluZycgPyB0aGlzLnJlc29sdmVUeXBlKGgpIDogdGhpcy5yZXNvbHZlVHlwZShoLnR5cGUsIGgudHlwZUFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkobi5tZW1iZXJzKSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLm1lbWJlcnMucHVzaCguLi5uLm1lbWJlcnMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignTm9kZSBoZXJpdGFnZSB3aXRob3V0IG1lbWJlcnMgZm91bmQnLCBoLCBuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGgudHlwZSA9PT0gJ09taXQnIHx8IGgudHlwZSA9PT0gJ1BpY2snKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbiA9IHRoaXMucmVzb2x2ZVR5cGVSZWYoaCk7XG4gICAgICAgICAgICAgICAgbm9kZS5tZW1iZXJzLnB1c2goLi4ubi5tZW1iZXJzKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaC50eXBlID09PSAnUmVhZG9ubHknKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbiA9IHRoaXMucmVzb2x2ZVR5cGUoeyBraW5kOiAndHlwZUFsaWFzJywgdHlwZTogaC50eXBlQXJndW1lbnRzWzBdIH0pO1xuICAgICAgICAgICAgICAgIG5vZGUubWVtYmVycy5wdXNoKC4uLm4ubWVtYmVycyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGgua2luZCA9PT0gJ3R5cGVMaXRlcmFsJykge1xuICAgICAgICAgICAgICAgIG5vZGUubWVtYmVycy5wdXNoKC4uLmgubWVtYmVycyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgVW5oYW5kbGVkIHR5cGUgXCIke2gudHlwZX1cIiBvbiAke25vZGUubmFtZX1gLCBoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub2RlLm1lbWJlcnMpIHtcbiAgICAgICAgICAgIG5vZGUubWVtYmVycyA9IHRoaXMuY2xlYW51cE1lbWJlcnMobm9kZS5tZW1iZXJzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmdlbmVyaWNzTWFwLnNpemUpIHtcbiAgICAgICAgICAgIG5vZGUuZ2VuZXJpY3NNYXAgPSBBcnJheS5mcm9tKHRoaXMuZ2VuZXJpY3NNYXApLnJlZHVjZSgocmVzdWx0LCBba2V5LCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9LCB7fSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgcmVzb2x2ZVR5cGVSZWYobm9kZSkge1xuICAgICAgICBpZiAobm9kZS50eXBlID09PSAnTm9uTnVsbGFibGUnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlVHlwZShub2RlLnR5cGVBcmd1bWVudHNbMF0pO1xuICAgICAgICB9IGVsc2UgaWYgKG5vZGUudHlwZSA9PT0gJ09taXQnIHx8IG5vZGUudHlwZSA9PT0gJ1BpY2snKSB7XG4gICAgICAgICAgICBjb25zdCBbdHlwZVJlZiwgdHlwZUtleXNdID0gbm9kZS50eXBlQXJndW1lbnRzO1xuICAgICAgICAgICAgY29uc3QgbWF0Y2hUeXBlID1cbiAgICAgICAgICAgICAgICB0eXBlS2V5cy5raW5kID09PSAndW5pb24nXG4gICAgICAgICAgICAgICAgICAgID8gKG06IGFueSkgPT4gdHlwZUtleXMudHlwZS5pbmNsdWRlcyhgJyR7bS5uYW1lfSdgKVxuICAgICAgICAgICAgICAgICAgICA6IChtOiBhbnkpID0+ICh0eXBlS2V5cy50eXBlID8/IHR5cGVLZXlzKSA9PT0gYCcke20ubmFtZX0nYDtcbiAgICAgICAgICAgIGNvbnN0IG4gPSB0aGlzLnJlc29sdmVUeXBlKHR5cGVvZiB0eXBlUmVmID09PSAnc3RyaW5nJyA/IHR5cGVSZWYgOiB0eXBlUmVmLnR5cGUpO1xuICAgICAgICAgICAgcmV0dXJuIHsgLi4ubiwgbWVtYmVyczogbi5tZW1iZXJzLmZpbHRlcihub2RlLnR5cGUgPT09ICdQaWNrJyA/IG1hdGNoVHlwZSA6IChtOiBhbnkpID0+ICFtYXRjaFR5cGUobSkpIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlVHlwZShub2RlLnR5cGUsIG5vZGUudHlwZS50eXBlQXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsZWFudXBNZW1iZXJzKG1lbWJlcnMpIHtcbiAgICAgICAgLy8gcmVtb3ZlIGR1cGxpY2F0ZXMgYW5kIHB1c2ggcmVxdWlyZWQgbWVtYmVycyB0byB0aGUgdG9wIG9mIHRoZSBsaXN0XG4gICAgICAgIHJldHVybiBtZW1iZXJzXG4gICAgICAgICAgICAuZmlsdGVyKCh7IG5hbWUsIC4uLmRhdGEgfSwgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0TWF0Y2hJbmRleCA9IG1lbWJlcnMuZmluZEluZGV4KChpdGVtKSA9PiBpdGVtLm5hbWUgPT09IG5hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzRmlyc3RBcHBlYXJhbmNlID0gZmlyc3RNYXRjaEluZGV4ID09PSBpbmRleDtcbiAgICAgICAgICAgICAgICBpZiAoIWlzRmlyc3RBcHBlYXJhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nTWVtYmVyID0gbWVtYmVyc1tmaXJzdE1hdGNoSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICBleGlzdGluZ01lbWJlci5kb2NzID8/PSBkYXRhLmRvY3M7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBpc0ZpcnN0QXBwZWFyYW5jZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZmlsdGVyKCh7IGRvY3MgfSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBkb2NzPy5zb21lKChkKSA9PiBkLmluY2x1ZGVzKCdAZGVwcmVjYXRlZCcpKSAhPT0gdHJ1ZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc29ydCgoYSwgYikgPT4gKGEub3B0aW9uYWwgJiYgIWIub3B0aW9uYWwgPyAxIDogIWEub3B0aW9uYWwgJiYgYi5vcHRpb25hbCA/IC0xIDogMCkpXG4gICAgICAgICAgICAuc29ydCgoYSwgYikgPT4gKHByaW9yaXRpc2VkTWVtYmVycy5pbmNsdWRlcyhhLm5hbWUpID8gLTEgOiBwcmlvcml0aXNlZE1lbWJlcnMuaW5jbHVkZXMoYi5uYW1lKSA/IDEgOiAwKSk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0Tm9kZShub2RlOiB0cy5Ob2RlKSB7XG4gICAgaWYgKHRzLmlzVW5pb25UeXBlTm9kZShub2RlKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAga2luZDogJ3VuaW9uJyxcbiAgICAgICAgICAgIHR5cGU6IG5vZGUudHlwZXMubWFwKGZvcm1hdE5vZGUpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmICh0cy5pc0ludGVyc2VjdGlvblR5cGVOb2RlKG5vZGUpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBraW5kOiAnaW50ZXJzZWN0aW9uJyxcbiAgICAgICAgICAgIHR5cGU6IG5vZGUudHlwZXMubWFwKGZvcm1hdE5vZGUpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmICh0cy5pc1R5cGVQYXJhbWV0ZXJEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAga2luZDogJ3R5cGVQYXJhbScsXG4gICAgICAgICAgICBuYW1lOiBwcmludE5vZGUobm9kZS5uYW1lKSxcbiAgICAgICAgICAgIGNvbnN0cmFpbnQ6IHByaW50Tm9kZShub2RlLmNvbnN0cmFpbnQpLFxuICAgICAgICAgICAgZGVmYXVsdDogcHJpbnROb2RlKG5vZGUuZGVmYXVsdCksXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHRzLmlzRnVuY3Rpb25UeXBlTm9kZShub2RlKSB8fCB0cy5pc01ldGhvZFNpZ25hdHVyZShub2RlKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAga2luZDogJ2Z1bmN0aW9uJyxcbiAgICAgICAgICAgIHBhcmFtczogbm9kZS5wYXJhbWV0ZXJzPy5tYXAoZm9ybWF0Tm9kZSksXG4gICAgICAgICAgICB0eXBlUGFyYW1zOiBub2RlLnR5cGVQYXJhbWV0ZXJzPy5tYXAoZm9ybWF0Tm9kZSksXG4gICAgICAgICAgICByZXR1cm5UeXBlOiBmb3JtYXROb2RlKG5vZGUudHlwZSksXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHRzLmlzRW51bURlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBraW5kOiAndHlwZUFsaWFzJyxcbiAgICAgICAgICAgIG5hbWU6IHByaW50Tm9kZShub2RlLm5hbWUpLFxuICAgICAgICAgICAgdHlwZToge1xuICAgICAgICAgICAgICAgIGtpbmQ6ICd1bmlvbicsXG4gICAgICAgICAgICAgICAgdHlwZTogbm9kZS5tZW1iZXJzLm1hcCgobm9kZSkgPT4gZm9ybWF0Tm9kZShub2RlLmluaXRpYWxpemVyKSksXG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmICh0cy5pc1RlbXBsYXRlTGl0ZXJhbFR5cGVOb2RlKG5vZGUpKSB7XG4gICAgICAgIGlmIChub2RlLnRlbXBsYXRlU3BhbnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0Tm9kZShub2RlLnRlbXBsYXRlU3BhbnNbMF0udHlwZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHMuaXNUeXBlQWxpYXNEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAga2luZDogJ3R5cGVBbGlhcycsXG4gICAgICAgICAgICBuYW1lOiBwcmludE5vZGUobm9kZS5uYW1lKSxcbiAgICAgICAgICAgIHR5cGU6IGZvcm1hdE5vZGUobm9kZS50eXBlKSxcbiAgICAgICAgICAgIHR5cGVQYXJhbXM6IG5vZGUudHlwZVBhcmFtZXRlcnM/Lm1hcChmb3JtYXROb2RlKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAodHMuaXNUeXBlTGl0ZXJhbE5vZGUobm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGtpbmQ6ICd0eXBlTGl0ZXJhbCcsXG4gICAgICAgICAgICBtZW1iZXJzOiBub2RlLm1lbWJlcnMubWFwKChub2RlKSA9PiAoe1xuICAgICAgICAgICAgICAgIGtpbmQ6ICdtZW1iZXInLFxuICAgICAgICAgICAgICAgIGRvY3M6IGdldEpzRG9jKG5vZGUpLFxuICAgICAgICAgICAgICAgIG5hbWU6IHByaW50Tm9kZShub2RlLm5hbWUpLFxuICAgICAgICAgICAgICAgIHR5cGU6IGZvcm1hdE5vZGUobm9kZSksXG4gICAgICAgICAgICAgICAgb3B0aW9uYWw6ICEhbm9kZS5xdWVzdGlvblRva2VuLFxuICAgICAgICAgICAgfSkpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmICh0cy5pc0ludGVyZmFjZURlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBraW5kOiAnaW50ZXJmYWNlJyxcbiAgICAgICAgICAgIGRvY3M6IGdldEpzRG9jKG5vZGUpLFxuICAgICAgICAgICAgbmFtZTogZm9ybWF0Tm9kZShub2RlLm5hbWUpLFxuICAgICAgICAgICAgbWVtYmVyczogbm9kZS5tZW1iZXJzLm1hcCgobm9kZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1lbWJlckRvY3MgPSBnZXRKc0RvYyhub2RlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXRjaERlZmF1bHQgPSBtZW1iZXJEb2NzPy5bbWVtYmVyRG9jcy5sZW5ndGggLSAxXS5tYXRjaCgvXlxccypEZWZhdWx0OlxccypgKFteYF0rKWBcXHMqJC8pO1xuICAgICAgICAgICAgICAgIGxldCBkZWZhdWx0VmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hEZWZhdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSA9IG1hdGNoRGVmYXVsdFsxXTtcbiAgICAgICAgICAgICAgICAgICAgbWVtYmVyRG9jcy5wb3AoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAga2luZDogJ21lbWJlcicsXG4gICAgICAgICAgICAgICAgICAgIGRvY3M6IHRyaW1BcnJheShtZW1iZXJEb2NzKSxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogZm9ybWF0Tm9kZShub2RlLm5hbWUpLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBmb3JtYXROb2RlKG5vZGUpLFxuICAgICAgICAgICAgICAgICAgICBvcHRpb25hbDogISFub2RlLnF1ZXN0aW9uVG9rZW4sXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB0eXBlUGFyYW1zOiBub2RlLnR5cGVQYXJhbWV0ZXJzPy5tYXAoZm9ybWF0Tm9kZSksXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHRzLmlzUGFyZW50aGVzaXplZFR5cGVOb2RlKG5vZGUpIHx8IHRzLmlzUHJvcGVydHlTaWduYXR1cmUobm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIGZvcm1hdE5vZGUobm9kZS50eXBlKTtcbiAgICB9XG5cbiAgICBpZiAodHMuaXNBcnJheVR5cGVOb2RlKG5vZGUpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBraW5kOiAnYXJyYXknLFxuICAgICAgICAgICAgdHlwZTogZm9ybWF0Tm9kZShub2RlLmVsZW1lbnRUeXBlKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAodHMuaXNUdXBsZVR5cGVOb2RlKG5vZGUpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBraW5kOiAndHVwbGUnLFxuICAgICAgICAgICAgdHlwZTogbm9kZS5lbGVtZW50cy5tYXAoZm9ybWF0Tm9kZSksXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHRzLmlzUGFyYW1ldGVyKG5vZGUpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBraW5kOiAncGFyYW0nLFxuICAgICAgICAgICAgbmFtZTogcHJpbnROb2RlKG5vZGUubmFtZSksXG4gICAgICAgICAgICB0eXBlOiBmb3JtYXROb2RlKG5vZGUudHlwZSksXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHRzLmlzVHlwZVJlZmVyZW5jZU5vZGUobm9kZSkpIHtcbiAgICAgICAgY29uc3Qgbm9kZVR5cGUgPSBmb3JtYXROb2RlKG5vZGUudHlwZU5hbWUpO1xuICAgICAgICBpZiAobm9kZVR5cGUgPT09ICdBcnJheScpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAga2luZDogJ2FycmF5JyxcbiAgICAgICAgICAgICAgICB0eXBlOlxuICAgICAgICAgICAgICAgICAgICBub2RlLnR5cGVBcmd1bWVudHMubGVuZ3RoID09PSAxXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGZvcm1hdE5vZGUobm9kZS50eXBlQXJndW1lbnRzWzBdKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBub2RlLnR5cGVBcmd1bWVudHMubWFwKGZvcm1hdE5vZGUpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbm9kZS50eXBlQXJndW1lbnRzXG4gICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgIGtpbmQ6ICd0eXBlUmVmJyxcbiAgICAgICAgICAgICAgICAgIHR5cGU6IG5vZGVUeXBlLFxuICAgICAgICAgICAgICAgICAgdHlwZUFyZ3VtZW50czogbm9kZS50eXBlQXJndW1lbnRzLm1hcChmb3JtYXROb2RlKSxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiBub2RlVHlwZTtcbiAgICB9XG5cbiAgICBpZiAodHMuaXNJbmRleGVkQWNjZXNzVHlwZU5vZGUobm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGtpbmQ6ICdpbmRleEFjY2VzcycsXG4gICAgICAgICAgICB0eXBlOiBmb3JtYXROb2RlKG5vZGUub2JqZWN0VHlwZSksXG4gICAgICAgICAgICBpbmRleDogcHJpbnROb2RlKG5vZGUuaW5kZXhUeXBlKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKG5vZGUua2luZCkge1xuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQW55S2V5d29yZDpcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkJvb2xlYW5LZXl3b3JkOlxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuSWRlbnRpZmllcjpcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkxpdGVyYWxUeXBlOlxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuTmV2ZXJLZXl3b3JkOlxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuTnVtYmVyS2V5d29yZDpcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlN0cmluZ0tleXdvcmQ6XG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5TdHJpbmdMaXRlcmFsOlxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuU3ltYm9sS2V5d29yZDpcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlR5cGVPcGVyYXRvcjpcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlVuZGVmaW5lZEtleXdvcmQ6XG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5Vbmtub3duS2V5d29yZDpcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlZvaWRLZXl3b3JkOlxuICAgICAgICAgICAgcmV0dXJuIHByaW50Tm9kZShub2RlKTtcblxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuTWFwcGVkVHlwZTpcbiAgICAgICAgICAgIGNvbnN0IG91dHB1dCA9IHByaW50Tm9kZShub2RlKTtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQXZvaWQgdXNpbmcgTWFwcGVkVHlwZSBpbiB1c2VyIGZhY2luZyB0eXBpbmdzLicsIG91dHB1dCk7XG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAvLyBkYXRhIHN0cnVjdHVyZSB1c2VkIGZvciBsb2NhdGluZyBhbmQgZGVidWdnaW5nIHVuZGVmaW5lZCBub2RlIGtpbmRzIC0gdW5jb21tZW50IHdoZW4gbmVlZGVkXG4gICAgICAgICAgICAvLyByZXR1cm4geyBfdW5rbm93bjogdHMuU3ludGF4S2luZFtub2RlLmtpbmRdLCBfb3V0cHV0OiBwcmludE5vZGUobm9kZSkgfTtcbiAgICAgICAgICAgIHRocm93IEVycm9yKGBVbmtub3duIG5vZGUga2luZCBcIiR7dHMuU3ludGF4S2luZFtub2RlLmtpbmRdfVwiXFxuJHtwcmludE5vZGUobm9kZSl9YCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRKc0RvYyhub2RlOiB0cy5Ob2RlICYgeyBqc0RvYz86IHsgZ2V0RnVsbFRleHQoKTogc3RyaW5nIH1bXSB9KSB7XG4gICAgcmV0dXJuIHRyaW1BcnJheShcbiAgICAgICAgbm9kZS5qc0RvYz8uZmxhdE1hcCgoZG9jKSA9PlxuICAgICAgICAgICAgZG9jXG4gICAgICAgICAgICAgICAgLmdldEZ1bGxUZXh0KClcbiAgICAgICAgICAgICAgICAuc3BsaXQoJ1xcbicpXG4gICAgICAgICAgICAgICAgLm1hcCgobGluZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgbGluZVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcKlxcL1xccyokLywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXlxccyooXFwvXFwqezEsMn18XFwqKS8sICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcmludE5vZGUobm9kZTogdHMuTm9kZSkge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB0c1ByaW50ZXIucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCBub2RlLCBub2RlLmdldFNvdXJjZUZpbGUoKSkucmVwbGFjZSgvXFxuXFxzKi9nLCAnICcpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0cmltQXJyYXkoYXJyYXk/OiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gYXJyYXk/LmpvaW4oJ1xcbicpLnRyaW0oKS5zcGxpdCgnXFxuJyk7XG59XG4iXSwibmFtZXMiOlsiVHlwZU1hcHBlciIsImZvcm1hdE5vZGUiLCJwcmludE5vZGUiLCJ0c1ByaW50ZXIiLCJ0cyIsImNyZWF0ZVByaW50ZXIiLCJyZW1vdmVDb21tZW50cyIsIm9taXRUcmFpbGluZ1NlbWljb2xvbiIsInByaW9yaXRpc2VkTWVtYmVycyIsImVudHJpZXMiLCJBcnJheSIsImZyb20iLCJub2RlTWFwIiwic29ydCIsInJlc29sdmVkRW50cmllcyIsIm1hcCIsIm5hbWUiLCJnZW5lcmljc01hcCIsIk1hcCIsInJlc29sdmVUeXBlIiwiaXNUb3BMZXZlbERlY2xhcmF0aW9uIiwibm9kZSIsImlzRW51bURlY2xhcmF0aW9uIiwiaXNJbnRlcmZhY2VEZWNsYXJhdGlvbiIsImlzVHlwZUFsaWFzRGVjbGFyYXRpb24iLCJleHRyYWN0SW50ZXJmYWNlSGVyaXRhZ2UiLCJoZXJpdGFnZUNsYXVzZXMiLCJmbGF0TWFwIiwiaCIsInR5cGVzIiwiZXhwcmVzc2lvbiIsInR5cGVBcmd1bWVudHMiLCJraW5kIiwidHlwZSIsIm5hbWVPck5vZGUiLCJtYXBJdGVtIiwiZ2V0IiwicmVzb2x2ZU5vZGUiLCJjb25zb2xlIiwiZXJyb3IiLCJoZXJpdGFnZSIsInR5cGVQYXJhbXMiLCJwYXJhbSIsImluZGV4IiwidmFsdWUiLCJkZWZhdWx0Iiwic2V0IiwibWVtYmVyTmFtZSIsInJlcGxhY2UiLCJtZW1iZXJzIiwiZmluZCIsIm1lbWJlciIsInJlc3QiLCJmaWx0ZXIiLCJzdWJUeXBlIiwibWF0Y2giLCJoYXMiLCJuIiwiaXNBcnJheSIsInB1c2giLCJ3YXJuIiwicmVzb2x2ZVR5cGVSZWYiLCJjbGVhbnVwTWVtYmVycyIsInNpemUiLCJyZWR1Y2UiLCJyZXN1bHQiLCJrZXkiLCJ0eXBlUmVmIiwidHlwZUtleXMiLCJtYXRjaFR5cGUiLCJtIiwiaW5jbHVkZXMiLCJkYXRhIiwiZmlyc3RNYXRjaEluZGV4IiwiZmluZEluZGV4IiwiaXRlbSIsImlzRmlyc3RBcHBlYXJhbmNlIiwiZXhpc3RpbmdNZW1iZXIiLCJkb2NzIiwic29tZSIsImQiLCJhIiwiYiIsIm9wdGlvbmFsIiwiY29uc3RydWN0b3IiLCJpbnB1dEZpbGVzIiwiZmlsZSIsImlucHV0R2xvYiIsInBhcnNlRmlsZSIsImZvckVhY2hDaGlsZCIsInR5cGVOb2RlIiwidGV4dCIsImlzVW5pb25UeXBlTm9kZSIsImlzSW50ZXJzZWN0aW9uVHlwZU5vZGUiLCJpc1R5cGVQYXJhbWV0ZXJEZWNsYXJhdGlvbiIsImNvbnN0cmFpbnQiLCJpc0Z1bmN0aW9uVHlwZU5vZGUiLCJpc01ldGhvZFNpZ25hdHVyZSIsInBhcmFtcyIsInBhcmFtZXRlcnMiLCJ0eXBlUGFyYW1ldGVycyIsInJldHVyblR5cGUiLCJpbml0aWFsaXplciIsImlzVGVtcGxhdGVMaXRlcmFsVHlwZU5vZGUiLCJ0ZW1wbGF0ZVNwYW5zIiwibGVuZ3RoIiwiaXNUeXBlTGl0ZXJhbE5vZGUiLCJnZXRKc0RvYyIsInF1ZXN0aW9uVG9rZW4iLCJtZW1iZXJEb2NzIiwibWF0Y2hEZWZhdWx0IiwiZGVmYXVsdFZhbHVlIiwicG9wIiwidHJpbUFycmF5IiwiaXNQYXJlbnRoZXNpemVkVHlwZU5vZGUiLCJpc1Byb3BlcnR5U2lnbmF0dXJlIiwiaXNBcnJheVR5cGVOb2RlIiwiZWxlbWVudFR5cGUiLCJpc1R1cGxlVHlwZU5vZGUiLCJlbGVtZW50cyIsImlzUGFyYW1ldGVyIiwiaXNUeXBlUmVmZXJlbmNlTm9kZSIsIm5vZGVUeXBlIiwidHlwZU5hbWUiLCJpc0luZGV4ZWRBY2Nlc3NUeXBlTm9kZSIsIm9iamVjdFR5cGUiLCJpbmRleFR5cGUiLCJTeW50YXhLaW5kIiwiQW55S2V5d29yZCIsIkJvb2xlYW5LZXl3b3JkIiwiSWRlbnRpZmllciIsIkxpdGVyYWxUeXBlIiwiTmV2ZXJLZXl3b3JkIiwiTnVtYmVyS2V5d29yZCIsIlN0cmluZ0tleXdvcmQiLCJTdHJpbmdMaXRlcmFsIiwiU3ltYm9sS2V5d29yZCIsIlR5cGVPcGVyYXRvciIsIlVuZGVmaW5lZEtleXdvcmQiLCJVbmtub3duS2V5d29yZCIsIlZvaWRLZXl3b3JkIiwiTWFwcGVkVHlwZSIsIm91dHB1dCIsIkVycm9yIiwianNEb2MiLCJkb2MiLCJnZXRGdWxsVGV4dCIsInNwbGl0IiwibGluZSIsInRyaW0iLCJFbWl0SGludCIsIlVuc3BlY2lmaWVkIiwiZ2V0U291cmNlRmlsZSIsImUiLCJhcnJheSIsImpvaW4iXSwibWFwcGluZ3MiOiJBQUFBLDZCQUE2Qjs7Ozs7Ozs7Ozs7SUFlaEJBLFVBQVU7ZUFBVkE7O0lBa0xHQyxVQUFVO2VBQVZBOztJQW9NQUMsU0FBUztlQUFUQTs7Ozs7O3NFQXBZSTtnQ0FFaUI7QUFRckMsTUFBTUMsWUFBWUMsWUFBR0MsYUFBYSxDQUFDO0lBQUVDLGdCQUFnQjtJQUFNQyx1QkFBdUI7QUFBSztBQUV2RixNQUFNQyxxQkFBcUI7SUFBQztDQUFPO0FBRTVCLElBQUEsQUFBTVIsYUFBTixNQUFNQTtJQWtCVFMsVUFBVTtRQUNOLE9BQU9DLE1BQU1DLElBQUksQ0FBQyxJQUFJLENBQUNDLE9BQU8sQ0FBQ0gsT0FBTyxJQUFJSSxJQUFJO0lBQ2xEO0lBRUFDLGtCQUFrQjtRQUNkLE9BQU8sSUFBSSxDQUFDTCxPQUFPLEdBQUdNLEdBQUcsQ0FBQyxDQUFDLENBQUNDLEtBQUs7WUFDN0IsSUFBSSxDQUFDQyxXQUFXLEdBQUcsSUFBSUM7WUFDdkIsT0FBTyxJQUFJLENBQUNDLFdBQVcsQ0FBQ0g7UUFDNUI7SUFDSjtJQUVVSSxzQkFDTkMsSUFBYSxFQUNpRTtRQUM5RSxPQUFPakIsWUFBR2tCLGlCQUFpQixDQUFDRCxTQUFTakIsWUFBR21CLHNCQUFzQixDQUFDRixTQUFTakIsWUFBR29CLHNCQUFzQixDQUFDSDtJQUN0RztJQUVVSSx5QkFBeUJKLElBQTZCLEVBQUU7WUFDdkRBO1FBQVAsUUFB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