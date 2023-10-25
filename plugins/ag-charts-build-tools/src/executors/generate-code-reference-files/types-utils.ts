import * as ts from 'typescript';

import { inputGlob, parseFile } from './executors-utils';

type HeritageType = { kind?: string; type: any; typeParams: any[]; members?: TypingMapItem[] } | string;
type TypingMapItem = { node: any; heritage?: HeritageType[] };

const tsPrinter = ts.createPrinter({ removeComments: true, omitTrailingSemicolon: true });

export function mapTyping(inputs: string[]) {
    const typesMap: Map<string, TypingMapItem> = new Map();
    for (const file of inputs.flatMap(inputGlob)) {
        parseFile(file).forEachChild((node) => {
            if (ts.isEnumDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
                const item: TypingMapItem = { node: formatNode(node) };
                if (ts.isInterfaceDeclaration(node)) {
                    item.heritage = node.heritageClauses?.flatMap((h) =>
                        h.types.map(({ expression, typeArguments }) =>
                            typeArguments
                                ? {
                                      kind: 'typeRef',
                                      type: formatNode(expression),
                                      typeParams: typeArguments.map(formatNode),
                                  }
                                : formatNode(expression)
                        )
                    );
                }
                typesMap.set(node.name.text, item);
            }
        });
    }
    return typesMap;
}

export function resolveType(typesMap: Map<string, TypingMapItem>, typeName: string | TypingMapItem['node']) {
    let node, heritage;
    if (typeof typeName === 'object') {
        node = typeName;
    } else if (!typesMap.has(typeName)) {
        console.log('Missing!', typeName);
        return null;
    } else {
        ({ node, heritage } = typesMap.get(typeName));
    }
    // console.log({ typeName, node, heritage });

    if (node.kind === 'indexAccess') {
        const memberName = node.index.replace(/^'(.*)'$/, '$1');
        const typeMembers = resolveType(typesMap, node.type).members;
        const indexType = typeMembers.find((item) => item.name === memberName).type;
        return resolveType(typesMap, indexType);
    }

    if (node.kind === 'typeAlias') {
        switch (node.type.kind) {
            case 'typeRef':
                if (node.type.type === 'NonNullable') {
                    return resolveType(typesMap, node.type.typeParams[0]);
                } else {
                    return resolveType(typesMap, node.type.type);
                }
            case 'intersection':
                heritage = node.type.type.filter((typeName) => {
                    if (typeName.kind === 'typeLiteral') {
                        return true;
                    }
                    if (typeName.kind === 'typeRef') {
                        typeName = typeName.type;
                    }
                    return !typeName.match(/^['{].*['}]$/);
                });
                break;
            // case 'union':
            //     break;
            // default:
            //     console.log(node);
        }
    }

    const heritageClone = heritage?.slice() ?? [];
    for (const h of heritageClone) {
        node.members ??= [];
        if (typeof h === 'string' || typesMap.has(h.type)) {
            const n = resolveType(typesMap, typeof h === 'string' ? h : h.type);
            node.members.push(...n.members);
        } else if (h.type === 'Omit' || h.type === 'Pick') {
            const [typeRef, typeKeys] = h.typeParams;
            const matchType =
                typeKeys.kind === 'union'
                    ? (m: any) => typeKeys.type.includes(`'${m.name}'`)
                    : (m: any) => typeKeys.type === `'${m.name}'`;
            const n = resolveType(typesMap, typeof typeRef === 'string' ? typeRef : typeRef.type);
            node.members.push(...n.members.filter(h.type === 'Pick' ? matchType : (m: any) => !matchType(m)));
        } else if (h.type === 'Readonly') {
            const resolvedType = resolveType(typesMap, { kind: 'typeAlias', type: h.typeParams[0] });
            node.members.push(...resolvedType.members);
        } else if (h.kind === 'typeLiteral') {
            node.members.push(...h.members);
        } else {
            // eslint-disable-next-line no-console
            console.warn(`Unhandled type "${h.type}" on ${typeName}`, h);
        }
        // remove to ensure we only run once
        heritage.splice(heritage.indexOf(h), 1);
        node.members = cleanupMembers(node.members);
    }

    return node;
}

function cleanupMembers(members) {
    // remove duplicates and push required members to the top of the list
    return members
        .filter(({ name }, index) => members.findIndex((item) => item.name === name) === index)
        .sort((a, b) => (a.optional && !b.optional ? 1 : !a.optional && b.optional ? -1 : 0));
}

export function formatNode(node: ts.Node) {
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
            kind: 'enum',
            name: formatNode(node.name),
            members: node.members.map((node) => ({
                docs: getJsDoc(node),
                type: formatNode(node),
            })),
        };
    }

    if (ts.isTypeAliasDeclaration(node)) {
        return {
            kind: 'typeAlias',
            name: formatNode(node.name),
            type: formatNode(node.type),
            typeParams: node.typeParameters?.map(formatNode),
        };
    }

    if (ts.isTypeLiteralNode(node)) {
        return {
            kind: 'typeLiteral',
            members: node.members.map((node) => ({
                docs: getJsDoc(node),
                name: formatNode(node.name),
                type: formatNode(node),
                optional: !!node.questionToken,
            })),
        };
    }

    if (ts.isInterfaceDeclaration(node)) {
        return {
            kind: 'interface',
            name: formatNode(node.name),
            members: node.members.map((node) => ({
                docs: getJsDoc(node),
                name: formatNode(node.name),
                type: formatNode(node),
                optional: !!node.questionToken,
            })),
            typeParams: node.typeParameters?.map(formatNode),
        };
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
            name: formatNode(node.name),
            type: formatNode(node.type),
        };
    }

    if (ts.isTypeReferenceNode(node)) {
        return node.typeArguments
            ? {
                  kind: 'typeRef',
                  type: formatNode(node.typeName),
                  typeParams: node.typeArguments.map(formatNode),
              }
            : formatNode(node.typeName);
    }

    if (ts.isIndexedAccessTypeNode(node)) {
        return {
            kind: 'indexAccess',
            type: formatNode(node.objectType),
            index: formatNode(node.indexType),
        };
    }

    switch (node.kind) {
        case ts.SyntaxKind.AnyKeyword:
        case ts.SyntaxKind.BooleanKeyword:
        case ts.SyntaxKind.Identifier:
        case ts.SyntaxKind.LiteralType:
        case ts.SyntaxKind.NeverKeyword:
        case ts.SyntaxKind.NumberKeyword:
        case ts.SyntaxKind.StringKeyword:
        case ts.SyntaxKind.StringLiteral:
        case ts.SyntaxKind.TypeOperator:
        case ts.SyntaxKind.UndefinedKeyword:
        case ts.SyntaxKind.UnknownKeyword:
        case ts.SyntaxKind.VoidKeyword:
            return printNode(node);

        case ts.SyntaxKind.MappedType:
            const output = printNode(node);
            // eslint-disable-next-line no-console
            console.warn('Avoid using MappedType in user facing typings.', output);
            return output;

        default:
            // data structure used for locating and debugging undefined node kinds
            return { _unknown: ts.SyntaxKind[node.kind], _output: printNode(node) };
    }
}

function getJsDoc(node: ts.Node & { jsDoc?: { getFullText(): string }[] }) {
    return node.jsDoc?.flatMap((doc) =>
        doc
            .getFullText()
            .split('\n')
            .map((line) =>
                line
                    .replace(/\*\/\s*$/, '')
                    .replace(/^\s*(\/\*{1,2}|\*)/, '')
                    .trim()
            )
            .filter(Boolean)
    );
}

export function printNode(node: ts.Node) {
    try {
        return tsPrinter.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile()).replace(/\n\s*/g, ' ');
    } catch (e) {
        return null;
    }
}
