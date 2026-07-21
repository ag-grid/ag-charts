import type { ApiReferenceConfig } from '@components/api-documentation/components/ApiReference';
import type {
    ArrayNode,
    EnumNode,
    FunctionNode,
    IndexAccessNode,
    InterfaceNode,
    MemberNode,
    MultiTypeNode,
    NodeTypes,
    TypeAliasNode,
    TypeLiteralNode,
    TypeNode,
    TypeParameterNode,
    TypeReferenceNode,
} from '@generate-code-reference-plugin/doc-interfaces/types';
import type Flexsearch from 'flexsearch';

import { entries } from 'ag-charts-core';

import { getIsBenchmarkOnlyBuild } from '../../utils/env';

type ApiReferenceType = Map<string, NodeTypes>;
type PossibleTypeNode = NodeTypes | undefined | PossibleTypeNode[];

export type SearchDatum = { label: string; searchable: string; navPath: NavigationPath[] };
export type SearchIndexDatum = SearchDatum & { id: number };
export type SearchIndex = Flexsearch.Document<SearchIndexDatum>;

export type SpecialTypesMap = Record<string, 'InterfaceArray' | 'InterfaceRecord' | 'NestedPage'>;
type HasProperty<T, K extends PropertyKey> = T extends { [P in K]: any } ? T : never;

export interface PageTitle {
    name: string;
    type?: string;
}

export interface NavigationData {
    pathname: string;
    hash: string;
    pageInterface: string;
    pageTitle: PageTitle;
}

export interface NavigationPath {
    name: string;
    type: string;
}

const hiddenInterfaces = new Set([
    'AxisValue',
    'CssColor',
    'CssShadow',
    'FontStyle',
    'FontWeight',
    'FontSize',
    'FontFamily',
    'GeoJSON',
    'Opacity',
    'PixelSize',
    'Ratio',
    'Degree',
    'DurationMs',
    'AgTimeInterval',
    'DatumKey',
]);

const isTypeNodeObject = (type: TypeNode): type is Exclude<TypeNode, string> => typeof type === 'object';
const isTypeReferenceNode = (type: TypeNode): type is TypeReferenceNode =>
    isTypeNodeObject(type) && type.kind === 'typeRef';
export const isArrayNode = (type: TypeNode): type is ArrayNode => isTypeNodeObject(type) && type.kind === 'array';
const isFunctionNode = (type: TypeNode): type is FunctionNode => isTypeNodeObject(type) && type.kind === 'function';
const isIndexAccessNode = (type: TypeNode): type is IndexAccessNode =>
    isTypeNodeObject(type) && type.kind === 'indexAccess';
const isUnionNode = (type: TypeNode): type is MultiTypeNode & { kind: 'union' } =>
    isTypeNodeObject(type) && type.kind === 'union';
const isIntersectionNode = (type: TypeNode): type is MultiTypeNode & { kind: 'intersection' } =>
    isTypeNodeObject(type) && type.kind === 'intersection';
const isTupleNode = (type: TypeNode): type is MultiTypeNode & { kind: 'tuple' } =>
    isTypeNodeObject(type) && type.kind === 'tuple';

export const INDEXED_SEARCH_FIELD = 'searchable';

export function cleanupName(name: string) {
    return name.replaceAll("'", '');
}

/** Anchor id of a row's collapsible detail block (type-code or union signature). */
export function getDetailsId(id: string) {
    return `${id}-details`;
}

export function isInterfaceHidden(name: string) {
    return hiddenInterfaces.has(name);
}

export function getMemberType(member: MemberNode): string {
    const { type } = member;
    if (!isTypeNodeObject(type)) {
        return type;
    }
    if (isTypeReferenceNode(type)) {
        return type.type;
    }
    if (isArrayNode(type) && isTypeNodeObject(type.type) && isTypeReferenceNode(type.type)) {
        return type.type.type;
    }
    if ('type' in type && typeof (type as any).type === 'string') {
        return (type as any).type;
    }
    // A single-or-array union (e.g. `Foo | Foo[]`) resolves to `Foo` so it expands like the bare alias.
    if (isUnionNode(type)) {
        const names = new Set(
            type.type.map((subType) => getReferencedTypeName(isArrayNode(subType) ? subType.type : subType))
        );
        const [only] = names;
        if (names.size === 1 && only) {
            return only;
        }
    }
    return type.kind;
}

export function normalizeType(refType: TypeNode, keepGenerics?: boolean): string {
    if (!isTypeNodeObject(refType)) {
        return refType;
    }

    if (isArrayNode(refType)) {
        const arrayType = normalizeType(refType.type);
        return arrayType.includes('|') ? `Array<${arrayType}>` : `${arrayType}[]`;
    }

    if (isTypeReferenceNode(refType)) {
        const showArgs = keepGenerics === true || refType.type === 'Omit' || refType.type === 'Pick';
        return showArgs && refType.typeArguments?.length
            ? `${refType.type}<${refType.typeArguments.map((typeArg) => normalizeType(typeArg)).join(', ')}>`
            : refType.type;
    }

    if (isUnionNode(refType)) {
        return refType.type.map((subType) => normalizeType(subType)).join(' | ');
    }

    if (isIntersectionNode(refType)) {
        return refType.type.map((subType) => normalizeType(subType)).join(' & ');
    }

    if (isFunctionNode(refType)) {
        return 'Function';
    }

    if (isTupleNode(refType)) {
        return `[${refType.type.map((subType) => normalizeType(subType)).join(', ')}]`;
    }

    if (isIndexAccessNode(refType)) {
        return `${normalizeType(refType.type)}[${refType.index}]`;
    }

    if (refType.kind === 'typeLiteral') {
        throw Error(
            'Avoid using type-literals in user facing typings as nameless types break the generated docs.\nYou should use an interface or a type-alias instead.'
        );
    }

    throw Error(`Unknown type encountered: ${JSON.stringify(refType)}`);
}

export function processMembers(
    interfaceRef: InterfaceNode | TypeLiteralNode | EnumNode,
    config: ApiReferenceConfig,
    typeArguments?: string[]
) {
    const { prioritise, include, exclude } = config;
    const members = Array.isArray(interfaceRef.members) ? interfaceRef.members : [];
    if (!members.length) {
        return [];
    }

    const filteredMembers = filterMembers(members, include, exclude);
    const sortedMembers = prioritiseMembers(filteredMembers, prioritise);

    if (interfaceRef.kind !== 'interface') {
        return sortedMembers;
    }

    const genericsMap = buildGenericsMap(interfaceRef, typeArguments);
    return sortedMembers.map((member) => applyGenericsToMember(member, genericsMap));
}

export function formatTypeToCode(
    apiNode: NodeTypes,
    member: MemberNode,
    reference: ApiReferenceType,
    seen: Set<string>,
    nodeName?: string,
    expandReferences = true
): string {
    if (apiNode.kind === 'interface' || apiNode.kind === 'typeAlias') {
        seen.add(apiNode.name);
    }

    if (apiNode.kind === 'interface') {
        return formatInterfaceCode(apiNode, member, reference, seen);
    }

    if (apiNode.kind === 'typeAlias') {
        return formatTypeAliasCode(apiNode, member, reference, seen, nodeName, expandReferences);
    }

    if (apiNode.kind === 'member') {
        return formatMemberNode(apiNode, member, reference);
    }

    // eslint-disable-next-line no-console
    console.warn('Unknown API node', apiNode);
    return '';
}

export function getNavigationDataFromPath([basePath, ...path]: NavigationPath[], specialType?: SpecialTypesMap) {
    const baseHash = `reference-${basePath.type}`;
    const data: NavigationData = {
        pathname: basePath.name,
        hash: baseHash,
        pageTitle: { name: basePath.type },
        pageInterface: basePath.type,
    };

    for (let i = 0; i < path.length; i++) {
        const item = path[i];
        if (isArrayOrRecordSpecialType(specialType, item.type)) {
            const child = path[i + 1];
            if (child) {
                if (data.hash.startsWith(baseHash)) {
                    const prePath = data.hash
                        .slice(baseHash.length + 1)
                        .split('-')
                        .filter(Boolean)
                        .concat(item.name);
                    data.pathname += `${prePath.join('/')}/${child.name}/`;
                    data.pageTitle = { name: prePath.join('.'), type: child.name };
                } else {
                    data.pathname += `${item.name}/${child.name}/`;
                    data.pageTitle = { name: item.name, type: child.name };
                }
                data.hash = `reference-${child.type}`;
                data.pageInterface = child.type;
                if (i + 2 >= path.length) {
                    data.hash += '-type';
                }
                i += 1;
                continue;
            }
        }

        if (specialType?.[item.type] === 'NestedPage') {
            const child = path[i + 1];
            if (child) {
                data.pathname += `${item.name}/${child.name}/`;
                data.hash = `reference-${child.type}`;
                data.pageTitle = { name: child.name };
                data.pageInterface = child.type;
                i += 1;
                continue;
            }
        }

        data.hash += `-${item.name}`;
    }

    return data;
}

export function extractSearchData(
    reference?: ApiReferenceType,
    interfaceRef?: NodeTypes,
    basePath: NavigationPath[] = [],
    labelPrefix = '',
    genericsMap?: Record<string, TypeNode>
): SearchDatum[] {
    const out: SearchDatum[] = [];
    collectSearchData(out, reference, interfaceRef, basePath, labelPrefix, genericsMap);
    return out;
}

// Shared accumulator avoids `push(...childArray)`, whose spread overflows V8's argument limit at ~150k entries.
function collectSearchData(
    out: SearchDatum[],
    reference: ApiReferenceType | undefined,
    interfaceRef: NodeTypes | undefined,
    basePath: NavigationPath[],
    labelPrefix: string,
    genericsMap?: Record<string, TypeNode>
): void {
    const aliasedUnion = resolveAliasedUnion(interfaceRef, reference);
    if (aliasedUnion) {
        collectUnionSearchData(
            out,
            reference,
            aliasedUnion.unionType,
            basePath,
            labelPrefix,
            mergeGenericsMaps(genericsMap, aliasedUnion.genericsMap)
        );
        return;
    }
    if (isInterfaceLikeNode(interfaceRef)) {
        collectInterfaceSearchData(out, reference, interfaceRef, basePath, labelPrefix, genericsMap);
    }
}

export function getOptionsStaticPaths(reference: ApiReferenceType) {
    if (getIsBenchmarkOnlyBuild()) return [];
    const getSubTypes = (ref: NodeTypes): string[] =>
        ref.kind === 'typeAlias' && isUnionNode(ref.type)
            ? ref.type.type.map((type) => (typeof type === 'string' ? type : (type as any).type))
            : [];

    const extractTypeValue = (refName: string) => {
        const ref = reference.get(refName);
        if (ref?.kind === 'interface') {
            const typeMember = ref.members.find((member) => member.name === 'type');
            if (typeof typeMember?.type === 'string') {
                return typeMember.type.replaceAll("'", '');
            }
        }
        return refName;
    };

    const createPageMapper = (memberName: string) => {
        return (pageInterface: string) => {
            const type = extractTypeValue(pageInterface);
            return {
                params: { memberName, type },
                props: { pageInterface, pageTitle: { name: memberName.replaceAll('/', '.'), type } },
            };
        };
    };

    const { axesRef, seriesRef, annotationRef, miniChartSeriesRef } = findRequiredRefs(reference);
    return [
        ...getSubTypes(axesRef).map(createPageMapper('axes')),
        ...getSubTypes(seriesRef).map(createPageMapper('series')),
        ...getSubTypes(annotationRef).map(createPageMapper('initialState/annotations')),
        ...getSubTypes(miniChartSeriesRef).map(createPageMapper('navigator/miniChart/series')),
    ];
}

export function getThemesApiStaticPaths(reference: ApiReferenceType) {
    if (getIsBenchmarkOnlyBuild()) return [];
    const interfaceRef = reference.get('AgBaseChartThemeOverrides');

    if (interfaceRef?.kind !== 'interface') {
        return [];
    }

    return interfaceRef.members.map((member) => ({
        params: { memberName: member.name.replaceAll("'", '') },
        props: { pageInterface: member.type, pageTitle: { name: member.name.replaceAll("'", '') } },
    }));
}

export function parseJsDocs(docs?: string[]) {
    return docs?.join('\n').replaceAll(/^@([a-z])/gm, (_, char) => char.toUpperCase());
}

function filterMembers(members: MemberNode[], include?: string[], exclude?: string[]) {
    if (!include?.length && !exclude?.length) {
        return members;
    }
    return members.filter((member) => !exclude?.includes(member.name) && (include?.includes(member.name) ?? true));
}

function prioritiseMembers(members: MemberNode[], prioritise?: string[]) {
    if (!prioritise) {
        return members;
    }
    return members.sort((a, b) => {
        if (prioritise.includes(a.name)) {
            return -1;
        }
        if (prioritise.includes(b.name)) {
            return 1;
        }
        return 0;
    });
}

function buildGenericsMap(interfaceRef: InterfaceNode, typeArguments?: string[]) {
    const genericsMap = new Map<string, unknown>(entries(interfaceRef.genericsMap ?? {}));
    if (interfaceRef.typeParams) {
        for (const [i, typeParam] of interfaceRef.typeParams.entries()) {
            genericsMap.set(
                typeParam.name,
                normalizeType(typeArguments?.[i] ?? typeParam.default ?? typeParam.constraint ?? typeParam.name)
            );
        }
    }
    return genericsMap;
}

function applyGenericsToMember(member: MemberNode, genericsMap: Map<string, unknown>) {
    let baseType: TypeNode = member.type;
    let omit: string | undefined;

    if (isTypeReferenceNode(member.type) && member.type.type === 'Omit') {
        const omitType = extractOmitType(member.type);
        if (omitType) {
            baseType = omitType.type;
            omit = omitType.omit;
        }
    }

    const substituted = substituteGenerics(baseType, genericsMap);
    return substituted === baseType ? member : { ...member, type: substituted, omit };
}

// Substitutes generic parameter names with their bound types, keeping node structure intact so
// wrapped generics (`SegmentOptions[]`) resolve. Normalising first would flatten the array to a
// string the parameter-keyed map cannot match. Returns the original node when nothing binds.
function substituteGenerics(type: TypeNode, genericsMap: Map<unknown, unknown>): TypeNode {
    if (typeof type === 'string') {
        return resolveGenericType(type, genericsMap) ?? type;
    }
    if (isArrayNode(type)) {
        const inner = substituteGenerics(type.type, genericsMap);
        return inner === type.type ? type : { ...type, type: inner };
    }
    if (isUnionNode(type) || isIntersectionNode(type) || isTupleNode(type)) {
        let changed = false;
        const subTypes = type.type.map((subType) => {
            const resolved = substituteGenerics(subType, genericsMap);
            changed ||= resolved !== subType;
            return resolved;
        });
        return changed ? { ...type, type: subTypes } : type;
    }
    if (isTypeReferenceNode(type) && type.typeArguments?.length) {
        let changed = false;
        const typeArguments = type.typeArguments.map((arg) => {
            const resolved = substituteGenerics(arg, genericsMap);
            changed ||= resolved !== arg;
            return resolved;
        });
        // typeArguments is declared as (string | TypeReferenceNode)[] but the generator stores any
        // TypeNode, so a resolved argument (e.g. within Wrapper<T[]>) may be an array or union node.
        return changed ? { ...type, typeArguments: typeArguments as TypeReferenceNode['typeArguments'] } : type;
    }
    return type;
}

function extractOmitType(memberType: TypeNode) {
    if (!isTypeReferenceNode(memberType) || memberType.type !== 'Omit' || !memberType.typeArguments?.length) {
        return null;
    }

    const [type, omit] = memberType.typeArguments;
    return { type, omit: typeof omit === 'string' ? omit : omit.type };
}

function formatInterfaceCode(
    apiNode: InterfaceNode,
    member: MemberNode,
    reference: ApiReferenceType,
    seen: Set<string>
) {
    const genericsMap = new Map<string, unknown>(entries(apiNode.genericsMap ?? {}));
    const additionalTypes = new Set<string>();
    const typesList = apiNode.members.map((nodeMember) => {
        const resolved = genericsMap.size ? applyGenericsToMember(nodeMember, genericsMap) : nodeMember;
        const memberString = `${resolved.name}${resolved.optional ? '?' : ''}: ${normalizeType(resolved.type)};`;
        collectAdditionalTypes(resolved, additionalTypes, seen);
        if (resolved.docs?.length && resolved.docs[0] !== '') {
            return resolved.docs
                .map((docsLine: string) => `// ${docsLine}`)
                .concat(memberString)
                .join('\n    ');
        }
        return memberString;
    });
    const result = [`interface ${apiNode.name} {\n    ${typesList.join('\n    ')}\n}`];

    for (const type of additionalTypes) {
        const typeRef = reference.get(type);
        if (typeRef) {
            result.push(formatTypeToCode(typeRef, member, reference, seen));
        }
    }

    return result.join('\n\n');
}

function formatTypeAliasCode(
    apiNode: TypeAliasNode,
    member: MemberNode,
    reference: ApiReferenceType,
    seen: Set<string>,
    nodeName?: string,
    expandReferences = true
) {
    if (isFunctionNode(apiNode.type)) {
        return formatFunctionCode(nodeName ?? apiNode.name, apiNode.type, member, reference);
    }

    if (isUnionNode(apiNode.type)) {
        return formatUnionTypeAlias(apiNode, apiNode.type, member, reference, seen, expandReferences);
    }

    return `type ${apiNode.name} = ${normalizeType(apiNode.type)};`;
}

function formatUnionTypeAlias(
    apiNode: TypeAliasNode,
    unionType: MultiTypeNode & { kind: 'union' },
    member: MemberNode,
    reference: ApiReferenceType,
    seen: Set<string>,
    expandReferences = true
) {
    let nodeType = normalizeType({
        kind: 'union',
        type: unionType.type
            .map((type) => normalizeType(type))
            .filter((type) => !reference.has(type) || !('deprecated' in reference.get(type)!)),
    });
    nodeType = '\n    ' + addNewLineOnPipe(nodeType);

    const result = [`type ${apiNode.name} = ${nodeType};`];

    // Special-type code blocks (series, axes, annotations) show the alias only; each variant has
    // its own navigable page, so inlining the sub-interfaces here is redundant noise.
    if (!expandReferences) {
        return result[0];
    }

    const additionalTypes = new Set(unionType.type.map((type) => normalizeType(type)));

    for (const type of additionalTypes) {
        if (shouldFormatAdditionalType(type, reference, seen)) {
            const subType = reference.get(type)!;
            const codeResult = formatTypeToCode(subType, member, reference, seen);
            if (codeResult) {
                result.push(codeResult);
            }
            if (subType.kind === 'interface' && subType.members.length) {
                for (const subMember of subType.members) {
                    additionalTypes.add(
                        normalizeType(isArrayNode(subMember.type) ? subMember.type.type : subMember.type)
                    );
                }
            }
        }
    }

    return result.join('\n\n');
}

function formatMemberNode(apiNode: MemberNode, member: MemberNode, reference: ApiReferenceType) {
    if (!isTypeNodeObject(apiNode.type)) {
        // eslint-disable-next-line no-console
        console.warn('Unknown API node', apiNode);
        return '';
    }

    if (isUnionNode(apiNode.type)) {
        const nodeType =
            '\n    ' +
            apiNode.type.type
                .map((type) => normalizeType(type))
                .filter((type) => !reference.has(type) || !('deprecated' in reference.get(type)!))
                .join(' | ')
                .replaceAll('|', '\n  |');
        return `type ${apiNode.name} = ${nodeType};`;
    }

    if (isFunctionNode(apiNode.type)) {
        return formatFunctionCode(apiNode.name, apiNode.type, member, reference);
    }

    // eslint-disable-next-line no-console
    console.warn('Unknown API node', apiNode);
    return '';
}

function formatFunctionCode(name: string, apiNode: FunctionNode, member: MemberNode, reference: ApiReferenceType) {
    const { params, returnType } = applyTypeArgumentsToFunction(apiNode, member, reference);
    const normalizedReturn = unwrapRequiredReturn(returnType);
    const additionalTypes = collectFunctionAdditionalTypes(params, normalizedReturn, reference);
    const paramsString = params?.map((param) => `${param.name}: ${normalizeType(param.type)}`).join(', ') ?? '';
    const codeSample = `function ${name}(${paramsString}): ${normalizeType(normalizedReturn, true)};`;
    const additionalSeen = new Set<string>();

    return additionalTypes.length
        ? [codeSample]
              .concat(additionalTypes.map((type) => formatTypeToCode(type, member, reference, additionalSeen)))
              .join('\n\n')
        : codeSample;
}

function applyTypeArgumentsToFunction(apiNode: FunctionNode, member: MemberNode, reference: ApiReferenceType) {
    let { params, returnType } = apiNode;

    if (isTypeReferenceNode(member.type) && member.type.typeArguments) {
        const { type, typeArguments } = member.type;
        const typeParams: TypeParameterNode[] | undefined = (reference.get(type) as any)?.typeParams;

        if (typeParams) {
            params = apiNode.params?.map((nodeParam) => {
                const genericValue = typeArguments[typeParams.findIndex((param) => param.name === nodeParam.type)];
                return genericValue ? { ...nodeParam, type: genericValue } : nodeParam;
            });

            if (isUnionNode(returnType)) {
                returnType = {
                    ...returnType,
                    type: returnType.type.map(
                        (nodeReturnType) =>
                            typeArguments[typeParams.findIndex((param) => param.name === nodeReturnType)] ??
                            nodeReturnType
                    ),
                };
            } else {
                returnType = typeArguments[typeParams.findIndex((param) => param.name === returnType)] ?? returnType;
            }
        }
    }

    return { params, returnType };
}

function unwrapRequiredReturn(returnType: TypeNode) {
    if (
        isTypeReferenceNode(returnType) &&
        returnType.type === 'Required' &&
        typeof returnType.typeArguments?.[0] === 'string'
    ) {
        return returnType.typeArguments[0];
    }
    return returnType;
}

function collectFunctionAdditionalTypes(
    params: FunctionNode['params'],
    returnType: TypeNode,
    reference: ApiReferenceType
) {
    return (
        params
            ?.map((param) => param.type)
            .concat(returnType)
            .flatMap(function typeMapper(type): PossibleTypeNode {
                if (!isTypeNodeObject(type)) {
                    return reference.get(type);
                }
                if (isTypeReferenceNode(type)) {
                    return reference.get(type.type);
                }
                if (isUnionNode(type) || isIntersectionNode(type) || isTupleNode(type)) {
                    return type.type.flatMap(typeMapper);
                }
                // eslint-disable-next-line no-console
                console.warn('Unknown type', type);
            })
            .filter((t): t is Exclude<TypeNode, string> => Boolean(t)) ?? []
    );
}

function collectAdditionalTypes(nodeMember: MemberNode, additionalTypes: Set<string>, seen: Set<string>) {
    if (isTypeNodeObject(nodeMember.type)) {
        const memberType = normalizeType(isArrayNode(nodeMember.type) ? nodeMember.type.type : nodeMember.type);
        if (!isInterfaceHidden(memberType) && !seen.has(memberType)) {
            additionalTypes.add(memberType);
        }
        return;
    }

    if (!isInterfaceHidden(nodeMember.type) && !seen.has(nodeMember.type)) {
        additionalTypes.add(nodeMember.type);
    }
}

function shouldFormatAdditionalType(type: string, reference: ApiReferenceType, seen: Set<string>) {
    if (!reference.has(type) || seen.has(type) || isInterfaceHidden(type)) {
        return false;
    }
    const referencedType = reference.get(type)!;
    return !('deprecated' in referencedType);
}

function isInterfaceLikeNode(
    interfaceRef?: NodeTypes
): interfaceRef is InterfaceNode | (TypeLiteralNode & { name: string }) {
    return Boolean(interfaceRef?.kind === 'interface' || (interfaceRef?.kind === 'typeLiteral' && interfaceRef.name));
}

export function isUnionTypeAlias(
    interfaceRef?: NodeTypes
): interfaceRef is TypeAliasNode & { type: MultiTypeNode & { kind: 'union' } } {
    return Boolean(interfaceRef?.kind === 'typeAlias' && isUnionNode(interfaceRef.type));
}

/** Resolves the referenced type name from a node that may be a bare string or a typeRef. */
export function getReferencedTypeName(type?: TypeNode): string | undefined {
    if (typeof type === 'string') {
        return type;
    }
    if (type && isTypeReferenceNode(type)) {
        return type.type;
    }
    return undefined;
}

/** A union member is "lost" when it is not rendered as an interface variant row (see `toUnionVariant`). */
function isVariantInterface(member: TypeNode, reference: ApiReferenceType): boolean {
    const name = getReferencedTypeName(isArrayNode(member) ? member.type : member);
    const node = name ? reference.get(name) : undefined;
    return node?.kind === 'interface' && !isInterfaceHidden(name!);
}

/** Names of a type's referenced members (unwrapping arrays), excluding hidden and unknown types. */
function referencedMemberNames(type: TypeNode, reference: ApiReferenceType): string[] {
    const members = isUnionNode(type) ? type.type : [type];
    return members
        .map((member) => getReferencedTypeName(isArrayNode(member) ? member.type : member))
        .filter((name): name is string => Boolean(name) && reference.has(name!) && !isInterfaceHidden(name!));
}

/**
 * Builds the type-signature code for a *mixed* union — one with members that are not rendered as
 * interface variant rows (primitives, hidden aliases like `CssColor`, or nested type aliases). It
 * preserves what the variant rows omit. Returns `undefined` for pure interface-only unions, whose
 * members are already fully represented by the rows.
 *
 * Referenced type *aliases* are spelled out (`type TextValue = string | number | Date;`) so nothing
 * is lost, but interfaces are left as bare names: they render once as variant rows and must not be
 * inlined here.
 */
export function formatUnionSignature(
    unionType: MultiTypeNode & { kind: 'union' },
    aliasName: string | undefined,
    reference: ApiReferenceType
): string | undefined {
    if (unionType.type.every((member) => isVariantInterface(member, reference))) {
        return undefined;
    }

    const signature = addNewLineOnPipe(normalizeType(unionType));
    const lines = [aliasName ? `type ${aliasName} =\n    ${signature};` : signature];

    const seen = new Set<string>(aliasName ? [aliasName] : []);
    const queue = referencedMemberNames(unionType, reference);
    while (queue.length) {
        const name = queue.shift()!;
        if (seen.has(name)) {
            continue;
        }
        seen.add(name);
        const node = reference.get(name);
        if (node?.kind !== 'typeAlias') {
            continue;
        }
        lines.push(`type ${name} = ${normalizeType(node.type)};`);
        queue.push(...referencedMemberNames(node.type, reference));
    }

    return lines.join('\n\n');
}

/**
 * Resolves a reference that represents a union, whether directly (a union type alias) or
 * indirectly. Axis-specific cross-line aliases (e.g. `AgCartesianCrossLineOptions`) are
 * emitted as an interface with no own members whose single heritage is a union type alias
 * (`AgBaseCrossLineOptions`); without this they resolve to zero members and disappear from
 * the navigation and options page. The alias' `genericsMap` is returned so generic members
 * of the union variants (e.g. `label`) resolve to the per-axis type.
 */
export function resolveAliasedUnion(
    interfaceRef?: NodeTypes,
    reference?: ApiReferenceType
): { unionType: MultiTypeNode & { kind: 'union' }; genericsMap?: Record<string, TypeNode> } | undefined {
    if (isUnionTypeAlias(interfaceRef)) {
        return { unionType: interfaceRef.type, genericsMap: interfaceRef.genericsMap };
    }
    if (
        interfaceRef?.kind === 'interface' &&
        interfaceRef.members.length === 0 &&
        interfaceRef.heritage?.length === 1
    ) {
        const [heritage] = interfaceRef.heritage;
        const heritageName = getReferencedTypeName(heritage);
        const target = heritageName ? reference?.get(heritageName) : undefined;
        if (isUnionTypeAlias(target)) {
            return { unionType: target.type, genericsMap: interfaceRef.genericsMap };
        }
    }
    return undefined;
}

export function mergeGenericsMaps(
    base?: Record<string, TypeNode>,
    overrides?: Record<string, TypeNode>
): Record<string, TypeNode> | undefined {
    if (!base) return overrides;
    if (!overrides) return base;
    return { ...base, ...overrides };
}

/**
 * Resolves the discriminated variants of an aliased union (see {@link resolveAliasedUnion}) into
 * `{ name, type }` navigation entries — `name` being the variant's `type` discriminator value and
 * `type` its interface name. Returns the alias' `genericsMap` so callers can resolve generic
 * members (e.g. the per-axis `label`) when rendering each variant. Mirrors the shape produced for
 * direct union aliases so both can feed the same typed-union navigation rendering.
 *
 * For a mixed union, `primitive` carries the non-interface members joined with ` | ` (the part the
 * variant rows omit, mirroring the right-hand signature from {@link formatUnionSignature}); it is
 * `undefined` when every member is an interface variant.
 */
export function getAliasedUnionVariants(
    interfaceRef?: NodeTypes,
    reference?: ApiReferenceType
):
    | { variants: NavigationPath[]; genericsMap?: Record<string, TypeNode>; primitive?: string; isArray?: boolean }
    | undefined {
    if (!reference) {
        return undefined;
    }
    const aliasedUnion = resolveAliasedUnion(interfaceRef, reference);
    if (!aliasedUnion) {
        return undefined;
    }

    const variants = collectAliasedVariants(aliasedUnion.unionType.type, reference);
    if (!variants.length) {
        return undefined;
    }

    const variantMembers = aliasedUnion.unionType.type.filter((member) => memberYieldsVariants(member, reference));
    // The variants come from an array member (e.g. `ContentSegment[]`), so the nav renders the
    // union member as an array of branches (`[{ ... }]`) rather than a single branch (`{ ... }`).
    const isArray = variantMembers.length > 0 && variantMembers.every((member) => isArrayNode(member));

    const primitiveMembers = aliasedUnion.unionType.type.filter((member) => !memberYieldsVariants(member, reference));
    const primitive = primitiveMembers.length
        ? primitiveMembers.map((member) => normalizeType(member)).join(' | ')
        : undefined;

    return { variants, genericsMap: aliasedUnion.genericsMap, primitive, isArray };
}

/**
 * Recursively resolves the discriminated interface variants of a union into `{ name, type }`
 * navigation entries, unwrapping array members and expanding nested union aliases (e.g.
 * `ContentSegment[]` → `ContentSegment` → `TextSegment | ImageSegment`). Mirrors the right-hand
 * side's `collectUnionVariants` so both surfaces show the same variant rows.
 */
function collectAliasedVariants(unionTypes: TypeNode[], reference: ApiReferenceType): NavigationPath[] {
    return unionTypes.flatMap((subType) => {
        const elementType = isArrayNode(subType) ? subType.type : subType;
        const subtypeName = getReferencedTypeName(elementType);
        const node = subtypeName ? reference.get(subtypeName) : undefined;
        if (isUnionTypeAlias(node)) {
            return collectAliasedVariants(node.type.type, reference);
        }
        if (node?.kind === 'interface' && !isInterfaceHidden(subtypeName!)) {
            const typeMember = node.members.find((member) => member.name === 'type');
            if (typeof typeMember?.type === 'string') {
                return [{ name: cleanupName(typeMember.type), type: subtypeName! }];
            }
        }
        return [];
    });
}

/**
 * Whether a union member contributes a discriminated interface variant (after array-unwrap and
 * union-alias expansion). Members that do not are the union's "primitive" part — see
 * {@link getAliasedUnionVariants}.
 */
function memberYieldsVariants(member: TypeNode, reference: ApiReferenceType): boolean {
    const elementType = isArrayNode(member) ? member.type : member;
    const name = getReferencedTypeName(elementType);
    const node = name ? reference.get(name) : undefined;
    if (isUnionTypeAlias(node)) {
        return node.type.type.some((nested) => memberYieldsVariants(nested, reference));
    }
    return Boolean(
        node?.kind === 'interface' &&
        !isInterfaceHidden(name!) &&
        node.members.some((typeMember) => typeMember.name === 'type' && typeof typeMember.type === 'string')
    );
}

/** Builds positional type arguments for an interface from a generics map keyed by type-param name. */
export function buildTypeArgumentsFromGenericsMap(
    interfaceRef: NodeTypes,
    genericsMap?: Record<string, TypeNode>
): string[] | undefined {
    const typeParams = (interfaceRef as HasProperty<NodeTypes, 'typeParams'>).typeParams;
    if (!genericsMap || !typeParams) {
        return undefined;
    }
    return typeParams.map((typeParam) =>
        normalizeType(genericsMap[typeParam.name] ?? typeParam.default ?? typeParam.name)
    );
}

function collectInterfaceSearchData(
    out: SearchDatum[],
    reference: ApiReferenceType | undefined,
    interfaceRef: InterfaceNode | (TypeLiteralNode & { name: string }),
    basePath: NavigationPath[],
    labelPrefix: string,
    parentGenericsMap?: Record<string, TypeNode>
): void {
    const genericsMap = mergeGenericsMaps(
        (interfaceRef as HasProperty<NodeTypes, 'genericsMap'>).genericsMap,
        parentGenericsMap
    );
    for (const member of interfaceRef.members) {
        const cleanedName = cleanupName(member.name);
        const newPath = { name: cleanedName, type: getMemberType(member) };
        if (basePath.find((p) => p.name === newPath.name && p.type === newPath.type)) {
            continue;
        }

        const navPath = basePath.concat(newPath);
        const label = labelPrefix + cleanedName;
        out.push({
            label,
            searchable: cleanedName.toLowerCase(),
            navPath,
        });

        const referenceTarget = resolveMemberReference(member, reference, genericsMap);
        if (referenceTarget) {
            collectSearchData(out, reference, referenceTarget, navPath, `${label}.`);
        }
    }
}

function resolveMemberReference(
    member: MemberNode,
    reference?: ApiReferenceType,
    genericsMap?: Record<string, TypeNode>
) {
    let element = genericsMap ? substituteGenerics(member.type, new Map(entries(genericsMap))) : member.type;
    while (isArrayNode(element)) {
        element = element.type;
    }
    const resolvedType = getReferencedTypeName(element);
    return resolvedType && reference?.get(resolvedType);
}

function collectUnionSearchData(
    out: SearchDatum[],
    reference: ApiReferenceType | undefined,
    unionType: MultiTypeNode & { kind: 'union' },
    basePath: NavigationPath[],
    labelPrefix: string,
    genericsMap?: Record<string, TypeNode>
): void {
    for (const typeName of unionType.type) {
        collectUnionSearchEntries(out, typeName, reference, basePath, labelPrefix, genericsMap);
    }
}

function collectUnionSearchEntries(
    out: SearchDatum[],
    typeName: TypeNode,
    reference: ApiReferenceType | undefined,
    basePath: NavigationPath[],
    labelPrefix: string,
    parentGenericsMap?: Record<string, TypeNode>
): void {
    const subtypeName = getReferencedTypeName(typeName);
    if (!subtypeName || isInterfaceHidden(subtypeName)) {
        return;
    }

    const subtypeRef = reference?.get(subtypeName);
    if (subtypeRef?.kind !== 'interface') {
        return;
    }

    const typeMember = subtypeRef.members.find((member) => member.name === 'type');
    if (!typeMember) {
        return;
    }

    const label = `${labelPrefix.replace(/\.$/, '')}[type=${typeMember.type as string}]`;
    const navPath = basePath.concat({
        name: cleanupName(getMemberType(typeMember)),
        type: subtypeName,
    });

    out.push({
        label,
        searchable: cleanupName(getMemberType(typeMember)).toLowerCase(),
        navPath,
    });
    collectSearchData(out, reference, subtypeRef, navPath, `${label}.`, parentGenericsMap);
}

function findRequiredRefs(reference: ApiReferenceType) {
    const typeNamesNotFound: string[] = [];
    const tryGet = (typeName: string) => {
        const result = reference.get(typeName);
        if (result == null) {
            typeNamesNotFound.push(typeName);
        }
        return result;
    };

    const axesRef = tryGet('AgChartAxesOptions')!;
    const seriesRef = tryGet('AgChartSeriesOptions')!;
    const annotationRef = tryGet('AgAnnotation')!;
    const miniChartSeriesRef = tryGet('AgMiniChartSeriesOptions')!;

    if (typeNamesNotFound.length) {
        throw new Error(`Cannot find types: ${typeNamesNotFound.join(', ')}`);
    }
    return { axesRef, seriesRef, annotationRef, miniChartSeriesRef };
}

function resolveGenericType(type: string, genericsMap: Map<unknown, unknown>): string | null {
    let resolvedType = type;
    while (genericsMap.has(resolvedType)) {
        const genericType = genericsMap.get(resolvedType);
        if (genericType === resolvedType) break;
        resolvedType = genericType as string;
    }
    return resolvedType === type ? null : resolvedType;
}

function addNewLineOnPipe(str: string) {
    let result = '';
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '<') {
            depth++;
            result += char;
        } else if (char === '>') {
            depth--;
            result += char;
        } else if (char === '|' && depth === 0) {
            result += '\n  |';
        } else {
            result += char;
        }
    }
    return result;
}

function isArrayOrRecordSpecialType(specialType: SpecialTypesMap | undefined, type: string) {
    return specialType?.[type] === 'InterfaceArray' || specialType?.[type] === 'InterfaceRecord';
}
