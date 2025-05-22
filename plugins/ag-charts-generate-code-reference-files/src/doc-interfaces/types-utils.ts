/* eslint-disable no-console */
import { inputGlob, parseFile } from 'ag-shared/plugin-utils';
import * as ts from 'typescript';

type NodeType = any;
// TODO: AG-14962 tighten HeritageType using a union.
type HeritageType =
    | { kind?: string; type: any; typeParams: any[]; typeArguments?: any[]; members?: TypingMapItem[] }
    | string;
type TypingMapItem = { node: NodeType; heritage?: HeritageType[] };

const tsPrinter = ts.createPrinter({ removeComments: true, omitTrailingSemicolon: true });

const prioritisedMembers = ['type', 'showOn'];

export class TypeMapper {
    protected nodeMap: Map<string, TypingMapItem> = new Map();
    protected genericsMap: Map<string, string>;

    constructor(inputFiles: string[]) {
        for (const file of inputFiles.flatMap(inputGlob)) {
            parseFile(file).forEachChild((node) => {
                if (this.isTopLevelDeclaration(node)) {
                    const typeNode: TypingMapItem = { node: formatNode(node) };
                    if (ts.isInterfaceDeclaration(node)) {
                        typeNode.heritage = this.extractInterfaceHeritage(node);
                    }
                    this.nodeMap.set(node.name.text, typeNode);
                }
            });
        }
    }

    entries() {
        return Array.from(this.nodeMap.entries()).sort();
    }

    resolvedEntries() {
        const result: any[] = [];
        for (const [name] of this.entries()) {
            this.genericsMap = new Map();
            try {
                result.push(this.resolveType(name));
            } catch (e) {
                console.error('Failed to resolve', name);
            }
        }
        return result;
    }

    protected isTopLevelDeclaration(
        node: ts.Node
    ): node is ts.EnumDeclaration | ts.InterfaceDeclaration | ts.TypeAliasDeclaration {
        return ts.isEnumDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node);
    }

    protected extractInterfaceHeritage(node: ts.InterfaceDeclaration) {
        return node.heritageClauses?.flatMap((h) =>
            h.types.map(({ expression, typeArguments }) =>
                typeArguments
                    ? {
                          kind: 'typeRef',
                          type: formatNode(expression),
                          typeArguments: typeArguments.map(formatNode),
                      }
                    : formatNode(expression)
            )
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    protected resolveType(nameOrNode: NodeType | string, typeArguments?: NodeType[]) {
        if (typeof nameOrNode === 'string') {
            const mapItem = this.nodeMap.get(nameOrNode);
            if (mapItem) {
                return this.resolveNode(mapItem, typeArguments);
            }
            const genericItem = this.genericsMap.get(nameOrNode);
            if (genericItem) {
                return this.resolveType(genericItem, typeArguments);
            }
            console.error('Missing!', nameOrNode);
        } else {
            return this.resolveNode({ node: nameOrNode }, typeArguments);
        }
    }

    protected resolveNode({ node, heritage = [] }: TypingMapItem, typeArguments?: NodeType[]) {
        if (node.typeParams) {
            node.typeParams.map((param, index) => {
                const value = typeArguments?.[index] ?? param.default;
                if (value && param.name !== value) {
                    this.genericsMap.set(param.name, value);
                }
            });
        }

        if (node.kind === 'indexAccess') {
            const memberName = node.index.replace(/^'(.*)'$/, '$1');
            const { members } = this.resolveType(node.type);
            const { type } = members.find((member) => member.name === memberName);
            return this.resolveType(type);
        }

        if (node.kind === 'typeAlias') {
            const { kind, type, ...rest } = node;
            switch (node.type.kind) {
                case 'typeRef':
                    return this.resolveNode(
                        { node: { ...rest, kind: 'interface', members: [] }, heritage: [type] },
                        typeArguments
                    );
                case 'typeLiteral':
                    return this.resolveType({ name: node.name, ...node.type });
                case 'intersection':
                    heritage = type.type.filter((subType) => {
                        if (subType.kind === 'typeLiteral') {
                            return true;
                        }
                        if (subType.kind === 'typeRef') {
                            subType = subType.type;
                        }
                        return !subType.match(/^['{].*['}]$/);
                    });
                    return this.resolveNode(
                        { node: { ...rest, kind: 'interface', members: [] }, heritage },
                        typeArguments
                    );
            }
        }

        for (const h of heritage) {
            node.members ??= [];
            if (typeof h === 'string' || this.nodeMap.has(h.type)) {
                const n = typeof h === 'string' ? this.resolveType(h) : this.resolveType(h.type, h.typeArguments);
                if (Array.isArray(n.members)) {
                    node.members.push(...n.members);
                } else {
                    // Uncomment if you need to debug missing inheritance members.
                    // console.warn('Node heritage without members found', h, n);
                }
            } else if (h.type === 'Omit' || h.type === 'Pick' || h.type === 'Required') {
                const n = this.resolveTypeRef(h);
                node.members.push(...n.members);
            } else if (h.type === 'Readonly' && h.typeArguments /* TODO: AG-14962 remove null-check */) {
                const n = this.resolveType({ kind: 'typeAlias', type: h.typeArguments[0] });
                node.members.push(...n.members);
            } else if (h.kind === 'typeLiteral') {
                if (h.members /* TODO: AG-14962 remove null-check */) {
                    node.members.push(...h.members);
                }
            } else {
                console.warn(`Unhandled type "${h.type}" on ${node.name}`, h);
                throw Error(`Unhandled type "${h.type}" on ${node.name}`);
            }
        }

        if (node.members) {
            node.members = this.cleanupMembers(node.members);
        }

        if (this.genericsMap.size) {
            node.genericsMap = Array.from(this.genericsMap).reduce((result, [key, value]) => {
                result[key] = value;
                return result;
            }, {});
        }

        return node;
    }

    protected resolveTypeRef(node) {
        if (node.type === 'NonNullable') {
            return this.resolveType(node.typeArguments[0]);
        } else if (node.type === 'Required') {
            const n = this.resolveType(node.typeArguments[0]);
            return { ...n, members: n.members.map((member) => ({ ...member, optional: false })) };
        } else if (node.type === 'Omit' || node.type === 'Pick') {
            const typeKeys = this.resolveUnionKeyType(node.typeArguments[1]);
            const expectedFilter = node.type === 'Pick';
            const matchType =
                typeKeys.kind === 'union'
                    ? (m: any) => typeKeys.type.includes(`'${m.name}'`) === expectedFilter
                    : (m: any) => ((typeKeys.type ?? typeKeys) === `'${m.name}'`) === expectedFilter;
            const typeArgument = node.typeArguments[0];
            const n = this.resolveType(typeof typeArgument === 'string' ? typeArgument : typeArgument.type);

            if (typeof typeArgument !== 'string') {
                const size = Math.min(typeArgument.typeArguments?.length, n.typeParams?.length);
                for (let i = 0; i < size; i++) {
                    this.genericsMap.set(n.typeParams[i].name, typeArgument.typeArguments[i]);
                }
            }

            return { ...n, members: n.members.filter(matchType) };
        } else {
            return this.resolveType(node.type, node.type.typeArguments);
        }
    }

    protected resolveUnionKeyType(unionKey: any) {
        if (typeof unionKey === 'string' && !unionKey.match(/^'.*'$/)) {
            return this.resolveType(unionKey).type;
        } else if (unionKey?.kind === 'union') {
            unionKey.type = unionKey.type.flatMap((t) => {
                t = this.resolveUnionKeyType(t);
                if (t.kind === 'union') {
                    return t.type;
                } else {
                    return [t];
                }
            });
        }
        return unionKey;
    }

    cleanupMembers(members) {
        // remove duplicates and push required members to the top of the list
        return members
            .filter(({ name, ...data }, index: number) => {
                const firstMatchIndex = members.findIndex((item) => item.name === name);
                const isFirstAppearance = firstMatchIndex === index;
                if (!isFirstAppearance) {
                    const existingMember = members[firstMatchIndex];
                    existingMember.docs ??= data.docs;
                }
                return isFirstAppearance;
            })
            .filter(({ docs }) => !docs?.some((d) => d.includes('@deprecated')))
            .sort((a, b) => {
                if (a.optional && !b.optional) return 1;
                if (!a.optional && b.optional) return -1;
                return 0;
            })
            .sort((a, b) => {
                if (prioritisedMembers.includes(a.name)) return -1;
                if (prioritisedMembers.includes(b.name)) return 1;
                return 0;
            });
    }
}

export function formatNode(node: ts.Node | undefined) {
    if (node == null) return undefined;

    if (ts.isUnionTypeNode(node)) {
        return {
            kind: 'union',
            type: node.types.map(formatNode),
        };
    }

    if (ts.isIntersectionTypeNode(node)) {
        return {
            kind: 'intersection',
            type: node.types.map(formatNode),
        };
    }

    if (ts.isTypeParameterDeclaration(node)) {
        return {
            kind: 'typeParam',
            name: printNode(node.name),
            constraint: printNode(node.constraint),
            default: printNode(node.default),
        };
    }

    if (ts.isFunctionTypeNode(node) || ts.isMethodSignature(node)) {
        return {
            kind: 'function',
            params: node.parameters?.map(formatNode),
            typeParams: node.typeParameters?.map(formatNode),
            returnType: formatNode(node.type),
        };
    }

    if (ts.isEnumDeclaration(node)) {
        return {
            kind: 'typeAlias',
            name: printNode(node.name),
            type: {
                kind: 'union',
                type: node.members.map((n) => formatNode(n.initializer)),
            },
        };
    }

    if (ts.isTemplateLiteralTypeNode(node)) {
        if (node.templateSpans.length === 1) {
            return formatNode(node.templateSpans[0].type);
        }
    }

    if (ts.isTypeAliasDeclaration(node)) {
        const docs = getJsDoc(node);
        const result = {
            kind: 'typeAlias',
            name: printNode(node.name),
            type: formatNode(node.type),
            typeParams: node.typeParameters?.map(formatNode),
            docs,
        };
        if (docs?.some((d) => d.includes('@deprecated'))) {
            result.deprecated = true;
        }
        return result;
    }

    if (ts.isTypeLiteralNode(node)) {
        return {
            kind: 'typeLiteral',
            members: node.members.map((n) => ({
                kind: 'member',
                docs: getJsDoc(n),
                name: printNode(n.name),
                type: formatNode(n),
                optional: !!n.questionToken,
            })),
        };
    }

    if (ts.isInterfaceDeclaration(node)) {
        const docs = getJsDoc(node);
        const result = {
            kind: 'interface',
            name: formatNode(node.name),
            members: node.members.map((n) => {
                let memberDocs = getJsDoc(n);
                const matchDefault = memberDocs?.at(-1)?.match(/^\s*Default:\s*`([^`]+)`\s*$/);
                let defaultValue: string | undefined;
                if (matchDefault) {
                    defaultValue = matchDefault[1];
                    memberDocs.pop();
                }
                if (memberDocs?.some((v) => v.startsWith('@returns'))) {
                    memberDocs = memberDocs.map((v) => {
                        if (!v.startsWith('@returns')) return v;
                        return v.replace('@returns', 'Returns');
                    });
                }
                return {
                    kind: 'member',
                    docs: trimArray(memberDocs),
                    name: formatNode(n.name),
                    type: formatNode(n),
                    optional: !!n.questionToken,
                    defaultValue,
                };
            }),
            typeParams: node.typeParameters?.map(formatNode),
            docs,
        };
        if (docs?.some((d) => d.includes('@deprecated'))) {
            result.deprecated = true;
        }
        return result;
    }

    if (ts.isParenthesizedTypeNode(node) || ts.isPropertySignature(node)) {
        return formatNode(node.type);
    }

    if (ts.isArrayTypeNode(node)) {
        return {
            kind: 'array',
            type: formatNode(node.elementType),
        };
    }

    if (ts.isTupleTypeNode(node)) {
        return {
            kind: 'tuple',
            type: node.elements.map(formatNode),
        };
    }

    if (ts.isParameter(node)) {
        return {
            kind: 'param',
            name: printNode(node.name),
            type: formatNode(node.type),
        };
    }

    if (ts.isTypeReferenceNode(node)) {
        const nodeType = formatNode(node.typeName);
        if (nodeType === 'Array' && node.typeArguments /* TODO: AG-14962 remove null-check */) {
            return {
                kind: 'array',
                type:
                    node.typeArguments.length === 1
                        ? formatNode(node.typeArguments[0])
                        : node.typeArguments.map(formatNode),
            };
        }
        return node.typeArguments
            ? {
                  kind: 'typeRef',
                  type: nodeType,
                  typeArguments: node.typeArguments.map(formatNode),
              }
            : nodeType;
    }

    if (ts.isIndexedAccessTypeNode(node)) {
        return {
            kind: 'indexAccess',
            type: formatNode(node.objectType),
            index: printNode(node.indexType),
        };
    }

    switch (node.kind) {
        case ts.SyntaxKind.AnyKeyword:
        case ts.SyntaxKind.BooleanKeyword:
        case ts.SyntaxKind.ConstructSignature:
        case ts.SyntaxKind.Identifier:
        case ts.SyntaxKind.LiteralType:
        case ts.SyntaxKind.NeverKeyword:
        case ts.SyntaxKind.NumberKeyword:
        case ts.SyntaxKind.ObjectKeyword:
        case ts.SyntaxKind.StringKeyword:
        case ts.SyntaxKind.StringLiteral:
        case ts.SyntaxKind.SymbolKeyword:
        case ts.SyntaxKind.TypeOperator:
        case ts.SyntaxKind.UndefinedKeyword:
        case ts.SyntaxKind.UnknownKeyword:
        case ts.SyntaxKind.VoidKeyword:
            return printNode(node);

        case ts.SyntaxKind.MappedType:
        case ts.SyntaxKind.ConditionalType:
            const output = printNode(node);
            console.warn('Avoid using MappedType/ConditionalType in user facing typings.', output);
            return output;

        default:
            // data structure used for locating and debugging undefined node kinds - uncomment when needed
            // return { _unknown: ts.SyntaxKind[node.kind], _output: printNode(node) };
            throw Error(`Unknown node kind "${ts.SyntaxKind[node.kind]}"\n${printNode(node)}`);
    }
}

function getJsDoc(node: ts.Node & { jsDoc?: { getFullText(): string }[] }) {
    if (node.jsDoc == null) {
        console.error(`unexpected 'jsDoc: ${node.jsDoc}' for node:`, node);
        throw new Error('jsDoc not found');
    }
    const lines: string[] = node.jsDoc.flatMap((doc) =>
        doc
            .getFullText()
            .split('\n')
            .map((line) =>
                line
                    .replace(/\*\/\s*$/, '')
                    .replace(/^\s*(\/\*{1,2}|\*)/, '')
                    .trim()
            )
            .reduce(
                (result, next) => {
                    // Re-join lines split due to line-length constraints; paragraphs should
                    // end on a double newline or use `\` at the end of the line. (standard markdown)
                    if (!result.at(-1)?.endsWith('\\') && /^[a-zA-Z0-9]+/.test(next)) {
                        result[result.length - 1] += ' ' + next;
                    } else {
                        result.push(next);
                    }
                    return result;
                },
                [''] as string[]
            )
    );
    if (lines.length === 0) {
        const fullText = node.jsDoc.flatMap((doc) => doc.getFullText());
        console.error(`unexpected 'lines.length === 0' for full text:`, fullText);
        throw new Error('unexpected empty jsDoc');
    }
    return trimArray(lines);
}

export function printNode(node: ts.Node | undefined) {
    if (node == null) throw new Error(`unexpected ${node} node`);
    try {
        return tsPrinter.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile()).replace(/\n\s*/g, ' ');
    } catch (e) {
        return null;
    }
}

function trimArray(array: string[]): string[] {
    return array.join('\n').trim().split('\n');
}
