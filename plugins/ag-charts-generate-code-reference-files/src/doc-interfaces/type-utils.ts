/* eslint-disable no-console */
import * as ts from 'typescript';

const tsPrinter = ts.createPrinter({
    removeComments: true,
    omitTrailingSemicolon: true,
});

export function formatNode<T extends ts.Node>(node: T | undefined, checker?: ts.TypeChecker): any {
    if (node == null) {
        throw Error('Node is undefined or null');
    }

    if (ts.isUnionTypeNode(node)) {
        return {
            kind: 'union',
            type: node.types.map((n) => formatNode(n)),
        };
    }

    if (ts.isIntersectionTypeNode(node)) {
        return {
            kind: 'intersection',
            type: node.types.map((n) => formatNode(n)),
        };
    }

    if (ts.isTupleTypeNode(node)) {
        return {
            kind: 'tuple',
            type: node.elements.map((n) => formatNode(n)),
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
            params: node.parameters?.map((n) => formatNode(n)),
            typeParams: node.typeParameters?.map((n) => formatNode(n)),
            returnType: formatNode(node.type),
        };
    }

    if (ts.isEnumDeclaration(node)) {
        return {
            kind: 'enum',
            name: printNode(node.name),
            members: Object.fromEntries(node.members.map((n) => [formatNode(n.name), formatNode(n.initializer)])),
        };
    }

    if (ts.isTemplateLiteralTypeNode(node)) {
        if (node.templateSpans.length === 1) {
            return formatNode(node.templateSpans[0].type);
        }
    }

    if (ts.isTypeAliasDeclaration(node)) {
        return {
            kind: 'typeAlias',
            name: printNode(node.name),
            type: expandComputedType(node, checker) ?? formatNode(node.type),
            typeParams: node.typeParameters?.map((n) => formatNode(n)),
            docs: getJsDoc(node),
        };
    }

    if (ts.isTypeLiteralNode(node)) {
        return {
            kind: 'typeLiteral',
            members: node.members.map((n) => ({
                kind: 'member',
                docs: getJsDoc(n),
                name: printNode(n.name),
                type: formatNode(n),
                optional: Boolean(n.questionToken),
            })),
        };
    }

    if (ts.isInterfaceDeclaration(node)) {
        return {
            kind: 'interface',
            name: formatNode(node.name),
            heritage: extractInterfaceHeritage(node),
            members: node.members.map((n) => ({
                kind: 'member',
                docs: getJsDoc(n),
                name: formatNode(n.name),
                type: formatNode(n),
                optional: Boolean(n.questionToken),
            })),
            typeParams: node.typeParameters?.map((n) => formatNode(n)),
            docs: getJsDoc(node),
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

    if (ts.isParameter(node)) {
        return {
            kind: 'param',
            name: printNode(node.name),
            type: formatNode(node.type),
        };
    }

    if (ts.isTypeReferenceNode(node)) {
        const nodeType = formatNode(node.typeName);
        if (nodeType === 'Array') {
            return {
                kind: 'array',
                type: formatNode(node.typeArguments![0]),
            };
        }
        return node.typeArguments
            ? {
                  kind: 'typeRef',
                  type: nodeType,
                  typeArguments: node.typeArguments.map((n) => formatNode(n)),
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
        case ts.SyntaxKind.BigIntKeyword:
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
            return printNode(node)!;

        case ts.SyntaxKind.MappedType:
        case ts.SyntaxKind.ConditionalType:
            const output = printNode(node);
            console.warn('Avoid using MappedType/ConditionalType in user facing typings.', output);
            return output!;

        default:
            // data structure used for locating and debugging undefined node kinds - uncomment when needed
            // return { _unknown: ts.SyntaxKind[node.kind], _output: printNode(node) };
            throw Error(`Unknown node kind "${ts.SyntaxKind[node.kind]}"\n${printNode(node)}`);
    }
}

// Mapped/conditional/indexed aliases can't be resolved syntactically. When one reduces to a
// literal union (e.g. `ColorKeys<Required<AgChartThemeParams>>` → `'accentColor' | ...`), use the
// checker to emit those concrete values; otherwise return undefined to fall back to raw text.
function expandComputedType(node: ts.TypeAliasDeclaration, checker?: ts.TypeChecker): any {
    if (!checker || !isComputedTypeNode(node.type, checker)) {
        return undefined;
    }

    const symbol = checker.getSymbolAtLocation(node.name);
    const aliasType = symbol && checker.getDeclaredTypeOfSymbol(symbol);
    if (!aliasType) {
        return undefined;
    }

    const constituents = aliasType.isUnion() ? aliasType.types : [aliasType];
    if (!constituents.every((type) => type.isStringLiteral() || type.isNumberLiteral())) {
        return undefined;
    }

    const literals = constituents.map((type) =>
        type.isStringLiteral() ? `'${type.value}'` : String((type as ts.NumberLiteralType).value)
    );
    return aliasType.isUnion() ? { kind: 'union', type: literals } : literals[0];
}

function isComputedTypeNode(typeNode: ts.TypeNode, checker: ts.TypeChecker): boolean {
    if (ts.isMappedTypeNode(typeNode) || ts.isConditionalTypeNode(typeNode) || ts.isIndexedAccessTypeNode(typeNode)) {
        return true;
    }
    // A reference to an alias that is itself computed (e.g. `ColorKeys<...>`).
    if (ts.isTypeReferenceNode(typeNode)) {
        const symbol = checker.getSymbolAtLocation(typeNode.typeName);
        return Boolean(
            symbol?.declarations?.some(
                (decl) =>
                    ts.isTypeAliasDeclaration(decl) &&
                    (ts.isMappedTypeNode(decl.type) ||
                        ts.isConditionalTypeNode(decl.type) ||
                        ts.isIndexedAccessTypeNode(decl.type))
            )
        );
    }
    return false;
}

export function getJsDoc(node: ts.Node & { jsDoc?: { getFullText(): string }[] }) {
    return trimArray(
        node.jsDoc?.flatMap((doc) =>
            doc
                .getFullText()
                .split('\n')
                .map((line) =>
                    line
                        .replace(/\*\/\s*$/, '')
                        .replace(/^\s*(\/\*{1,2}|\*)/, '')
                        .trim()
                )
                .reduce<string[]>((result, next) => {
                    // Re-join lines split due to line-length constraints; paragraphs should
                    // end on a double newline or use `\` at the end of the line. (standard markdown)
                    const last = result.at(-1);
                    if (next && last && !last.endsWith('\\') && !next.startsWith('-')) {
                        result[result.length - 1] += ' ' + next;
                    } else {
                        result.push(next);
                    }
                    return result;
                }, [])
        )
    );
}

export function printNode(node: ts.Node): string;
export function printNode(node: ts.Node | undefined): string | undefined;
export function printNode(node: ts.Node | undefined) {
    if (node == null) return;
    try {
        return tsPrinter.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile());
    } catch {}
}

function trimArray(array?: string[]): string[] | undefined {
    const trimmed = array?.join('\n').trim();
    if (trimmed) {
        return trimmed.split('\n');
    }
}

function extractInterfaceHeritage(node: ts.InterfaceDeclaration) {
    return node.heritageClauses?.flatMap((heritageClause) =>
        heritageClause.types.map(({ expression, typeArguments }) =>
            typeArguments
                ? {
                      kind: 'typeRef',
                      type: formatNode(expression),
                      typeArguments: typeArguments.map((n) => formatNode(n)),
                  }
                : formatNode(expression)
        )
    );
}
