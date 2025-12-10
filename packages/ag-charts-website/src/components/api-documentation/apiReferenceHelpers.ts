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
const isArrayNode = (type: TypeNode): type is ArrayNode => isTypeNodeObject(type) && type.kind === 'array';
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
        return keepGenerics && refType.typeArguments?.length
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
    nodeName?: string
): string {
    if (apiNode.kind === 'interface' || apiNode.kind === 'typeAlias') {
        seen.add(apiNode.name);
    }

    if (apiNode.kind === 'interface') {
        return formatInterfaceCode(apiNode, member, reference, seen);
    }

    if (apiNode.kind === 'typeAlias') {
        return formatTypeAliasCode(apiNode, member, reference, seen, nodeName);
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
    labelPrefix = ''
): SearchDatum[] {
    if (isInterfaceLikeNode(interfaceRef)) {
        return extractInterfaceSearchData(reference, interfaceRef, basePath, labelPrefix);
    }
    if (isUnionTypeAlias(interfaceRef)) {
        return extractUnionSearchData(reference, interfaceRef, basePath, labelPrefix);
    }
    return [];
}

export function getOptionsStaticPaths(reference: ApiReferenceType) {
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
    let omit: string | undefined;
    let memberType: string | TypeNode = normalizeType(member.type);

    if (memberType === 'Omit') {
        const omitType = extractOmitType(member.type);
        memberType = omitType?.type ?? memberType;
        omit = omitType?.omit;
    }

    const genericType = typeof memberType === 'string' ? resolveGenericType(memberType, genericsMap) : null;
    return genericType ? { ...member, type: genericType, omit } : member;
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
    const additionalTypes = new Set<string>();
    const typesList = apiNode.members.map((nodeMember) => {
        const memberString = `${nodeMember.name}${nodeMember.optional ? '?' : ''}: ${normalizeType(nodeMember.type)};`;
        collectAdditionalTypes(nodeMember, additionalTypes, seen);
        if (nodeMember.docs?.length && nodeMember.docs[0] !== '') {
            return nodeMember.docs
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
    nodeName?: string
) {
    if (isFunctionNode(apiNode.type)) {
        return formatFunctionCode(nodeName ?? apiNode.name, apiNode.type, member, reference);
    }

    if (isUnionNode(apiNode.type)) {
        return formatUnionTypeAlias(apiNode, apiNode.type, member, reference, seen);
    }

    return `type ${apiNode.name} = ${normalizeType(apiNode.type)};`;
}

function formatUnionTypeAlias(
    apiNode: TypeAliasNode,
    unionType: MultiTypeNode & { kind: 'union' },
    member: MemberNode,
    reference: ApiReferenceType,
    seen: Set<string>
) {
    let nodeType = normalizeType({
        kind: 'union',
        type: unionType.type
            .map((type) => normalizeType(type))
            .filter((type) => !reference.has(type) || !('deprecated' in reference.get(type)!)),
    });
    nodeType = '\n    ' + addNewLineOnPipe(nodeType);

    const result = [`type ${apiNode.name} = ${nodeType};`];
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

function isUnionTypeAlias(
    interfaceRef?: NodeTypes
): interfaceRef is TypeAliasNode & { type: MultiTypeNode & { kind: 'union' } } {
    return Boolean(interfaceRef?.kind === 'typeAlias' && isUnionNode(interfaceRef.type));
}

function extractInterfaceSearchData(
    reference: ApiReferenceType | undefined,
    interfaceRef: InterfaceNode | (TypeLiteralNode & { name: string }),
    basePath: NavigationPath[],
    labelPrefix: string
) {
    const { genericsMap } = interfaceRef as HasProperty<NodeTypes, 'genericsMap'>;
    return interfaceRef.members.flatMap((member) => {
        const cleanedName = cleanupName(member.name);
        const newPath = { name: cleanedName, type: getMemberType(member) };
        if (basePath.find((p) => p.name === newPath.name && p.type === newPath.type)) {
            return [];
        }

        const navPath = basePath.concat(newPath);
        const label = labelPrefix + cleanedName;
        const results: SearchDatum[] = [
            {
                label,
                searchable: cleanedName.toLowerCase(),
                navPath,
            },
        ];

        const referenceTarget = resolveMemberReference(member, reference, genericsMap);
        if (referenceTarget) {
            results.push(...extractSearchData(reference, referenceTarget, navPath, `${label}.`));
        }

        return results;
    });
}

function resolveMemberReference(
    member: MemberNode,
    reference?: ApiReferenceType,
    genericsMap?: Record<string, TypeNode>
) {
    const resolveTypeName = (type: TypeNode | string | undefined): string | undefined => {
        if (!type) return;
        if (isArrayNode(type)) {
            return resolveTypeName(type.type);
        }
        if (typeof type === 'string') {
            const mappedType = genericsMap?.[type] ?? type;
            return typeof mappedType === 'string' ? mappedType : undefined;
        }
        if (isTypeReferenceNode(type) && typeof type.type === 'string') {
            return type.type;
        }
    };

    const resolvedType = resolveTypeName(member.type);
    return resolvedType && reference?.get(resolvedType);
}

function extractUnionSearchData(
    reference: ApiReferenceType | undefined,
    interfaceRef: TypeAliasNode & { type: MultiTypeNode & { kind: 'union' } },
    basePath: NavigationPath[],
    labelPrefix: string
) {
    return interfaceRef.type.type
        .flatMap((typeName) => buildUnionSearchEntries(typeName, reference, basePath, labelPrefix))
        .filter((item): item is SearchDatum => Boolean(item));
}

function buildUnionSearchEntries(
    typeName: TypeNode,
    reference: ApiReferenceType | undefined,
    basePath: NavigationPath[],
    labelPrefix: string
) {
    if (typeof typeName !== 'string' || isInterfaceHidden(typeName)) {
        return [];
    }

    const subtypeRef = reference?.get(typeName);
    if (subtypeRef?.kind !== 'interface') {
        return [];
    }

    const typeMember = subtypeRef.members.find((member) => member.name === 'type');
    if (!typeMember) {
        return [];
    }

    const label = `${labelPrefix.replace(/\.$/, '')}[type=${typeMember.type as string}]`;
    const navPath = basePath.concat({
        name: cleanupName(getMemberType(typeMember)),
        type: typeName,
    });

    return [
        {
            label,
            searchable: cleanupName(getMemberType(typeMember)).toLowerCase(),
            navPath,
        },
        ...extractSearchData(reference, subtypeRef, navPath, `${label}.`),
    ];
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
