import type { ApiReferenceConfig } from '@components/api-documentation/components/ApiReference';
import type {
    EnumNode,
    FunctionNode,
    InterfaceNode,
    MemberNode,
    NodeTypes,
    TypeLiteralNode,
    TypeNode,
    TypeParameterNode,
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

const hiddenInterfaces = [
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
];

export const INDEXED_SEARCH_FIELD = 'searchable';

export function cleanupName(name: string) {
    return name.replaceAll("'", '');
}

export function isInterfaceHidden(name: string) {
    return hiddenInterfaces.includes(name);
}

export function getMemberType(member: MemberNode): string {
    if (typeof member.type === 'object') {
        if ('type' in member.type && typeof member.type.type === 'string') {
            return member.type.type;
        }
        if (
            member.type.kind === 'array' &&
            typeof member.type.type === 'object' &&
            member.type.type.kind === 'typeRef'
        ) {
            return member.type.type.type;
        }
        return member.type.kind;
    }
    return member.type;
}

export function normalizeType(refType: TypeNode, keepGenerics?: boolean): string {
    if (typeof refType === 'string') {
        return refType;
    }
    switch (refType.kind) {
        case 'array':
            const arrayType = normalizeType(refType.type);
            return arrayType.includes('|') ? `Array<${arrayType}>` : `${arrayType}[]`;
        case 'typeRef':
            return keepGenerics && refType.typeArguments?.length
                ? `${refType.type}<${refType.typeArguments.map((typeArg) => normalizeType(typeArg)).join(', ')}>`
                : refType.type;
        case 'union':
            return refType.type.map((subType) => normalizeType(subType)).join(' | ');
        case 'intersection':
            return refType.type.map((subType) => normalizeType(subType)).join(' & ');
        case 'function':
            return 'Function';
        case 'tuple':
            return `[${refType.type.map((subType) => normalizeType(subType)).join(', ')}]`;
        case 'indexAccess':
            return `${normalizeType(refType.type)}[${refType.index}]`;
        case 'typeLiteral':
            throw Error(
                'Avoid using type-literals in user facing typings as nameless types break the generated docs.\nYou should use an interface or a type-alias instead.'
            );
        default:
            throw Error(`Unknown type encountered: ${JSON.stringify(refType)}`);
    }
}

export function processMembers(
    interfaceRef: InterfaceNode | TypeLiteralNode | EnumNode,
    config: ApiReferenceConfig,
    typeArguments?: string[]
) {
    let { members } = interfaceRef;
    if (!Array.isArray(members)) return [];
    const { prioritise, include, exclude } = config;
    const isInterface = interfaceRef.kind === 'interface';
    const genericsMap = new Map(isInterface ? entries(interfaceRef.genericsMap ?? {}) : null);
    if (isInterface && interfaceRef.typeParams) {
        for (const [i, typeParam] of interfaceRef.typeParams.entries()) {
            genericsMap.set(
                typeParam.name,
                normalizeType(typeArguments?.[i] ?? typeParam.default ?? typeParam.constraint ?? typeParam.name)
            );
        }
    }
    if (include?.length || exclude?.length) {
        members = members.filter(
            (member) => !exclude?.includes(member.name) && (include?.includes(member.name) ?? true)
        );
    }
    if (prioritise) {
        members = members.sort((a, b) => {
            if (prioritise.includes(a.name)) {
                return -1;
            } else if (prioritise.includes(b.name)) {
                return 1;
            } else {
                return 0;
            }
        });
    }
    return members.map((member) => {
        if (isInterface) {
            let omit: string[] | undefined;
            let memberType = normalizeType(member.type);
            if (memberType === 'Omit') {
                const { typeArguments: memberTypeArguments } = member.type as HasProperty<TypeNode, 'typeArguments'>;
                memberType = memberTypeArguments[0];
                omit = memberTypeArguments[1];
            }
            const genericType = resolveGenericType(memberType, genericsMap);
            return genericType ? { ...member, type: genericType, omit } : member;
        }
        return member;
    });
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
        const additionalTypes = new Set<string>();
        const typesList = apiNode.members.map((nodeMember) => {
            const memberString = `${nodeMember.name}${nodeMember.optional ? '?' : ''}: ${normalizeType(nodeMember.type)};`;
            if (typeof nodeMember.type === 'object') {
                const memberType = normalizeType(
                    nodeMember.type.kind === 'array' ? nodeMember.type.type : nodeMember.type
                );
                if (!isInterfaceHidden(memberType) && !seen.has(memberType)) {
                    additionalTypes.add(memberType);
                }
            } else if (!isInterfaceHidden(nodeMember.type) && !seen.has(nodeMember.type)) {
                additionalTypes.add(nodeMember.type);
            }
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

    if (apiNode.kind === 'typeAlias' && typeof apiNode.type === 'object' && apiNode.type.kind === 'function') {
        return formatFunctionCode(nodeName ?? apiNode.name, apiNode.type, member, reference);
    }

    if (apiNode.kind === 'typeAlias') {
        if (typeof apiNode.type === 'object' && apiNode.type.kind === 'union') {
            let nodeType = normalizeType({
                kind: 'union',
                type: apiNode.type.type
                    .map((type) => normalizeType(type))
                    .filter((type) => !reference.has(type) || !('deprecated' in reference.get(type)!)),
            });
            nodeType = '\n    ' + addNewLineOnPipe(nodeType);

            const result = [`type ${apiNode.name} = ${nodeType};`];
            const additionalTypes = new Set(apiNode.type.type.map((type) => normalizeType(type)));

            for (const type of additionalTypes) {
                if (
                    reference.has(type) &&
                    !seen.has(type) &&
                    !isInterfaceHidden(type) &&
                    !('deprecated' in reference.get(type)!)
                ) {
                    const subType = reference.get(type)!;
                    const codeResult = formatTypeToCode(subType, member, reference, seen);
                    if (codeResult) {
                        result.push(codeResult);
                    }
                    if (subType.kind === 'interface' && subType.members.length) {
                        for (const subMember of subType.members) {
                            additionalTypes.add(
                                normalizeType(
                                    typeof subMember.type === 'object' && subMember.type.kind === 'array'
                                        ? subMember.type.type
                                        : subMember.type
                                )
                            );
                        }
                    }
                }
            }

            return result.join('\n\n');
        }
        return `type ${apiNode.name} = ${normalizeType(apiNode.type)};`;
    }

    if (apiNode.kind === 'member' && typeof apiNode.type === 'object') {
        if (apiNode.type.kind === 'union') {
            const nodeType =
                '\n    ' +
                apiNode.type.type
                    .map((type) => normalizeType(type))
                    .filter((type) => !reference.has(type) || !('deprecated' in reference.get(type)!))
                    .join(' | ')
                    .replaceAll('|', '\n  |');
            return `type ${apiNode.name} = ${nodeType};`;
        }

        if (apiNode.type.kind === 'function') {
            return formatFunctionCode(apiNode.name, apiNode.type, member, reference);
        }
    }

    // eslint-disable-next-line no-console
    console.warn('Unknown API node', apiNode);
    return '';
}

function formatFunctionCode(name: string, apiNode: FunctionNode, member: MemberNode, reference: ApiReferenceType) {
    let { params, returnType } = apiNode;

    if (typeof member.type === 'object' && member.type.kind === 'typeRef' && member.type.typeArguments) {
        const { type, typeArguments } = member.type;
        const typeParams: TypeParameterNode[] = (reference.get(type) as any)?.typeParams;

        if (typeParams) {
            params = apiNode.params?.map((nodeParam) => {
                const genericValue = typeArguments[typeParams.findIndex((param) => param.name === nodeParam.type)];
                return genericValue ? { ...nodeParam, type: genericValue } : nodeParam;
            });

            if (typeof returnType === 'object' && returnType.kind === 'union') {
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

    if (
        typeof returnType === 'object' &&
        returnType.kind === 'typeRef' &&
        returnType.type === 'Required' &&
        typeof returnType.typeArguments?.[0] === 'string'
    ) {
        returnType = returnType.typeArguments[0];
    }

    const additionalTypes = params
        ?.map((param) => param.type)
        .concat(returnType)
        .flatMap(function typeMapper(type): PossibleTypeNode {
            if (typeof type === 'string') {
                return reference.get(type);
            }
            if (type.kind === 'typeRef') {
                return reference.get(type.type);
            }
            if (type.kind === 'union' || type.kind === 'intersection' || type.kind === 'tuple') {
                return type.type.flatMap(typeMapper);
            }
            // eslint-disable-next-line no-console
            console.warn('Unknown type', type);
        })
        .filter((t): t is Exclude<TypeNode, string> => Boolean(t));

    const paramsString = params?.map((param) => `${param.name}: ${normalizeType(param.type)}`).join(', ') ?? '';
    const codeSample = `function ${name}(${paramsString}): ${normalizeType(returnType, true)};`;
    const additionalSeen = new Set<string>();

    return additionalTypes
        ? [codeSample]
              .concat(additionalTypes.map((type) => formatTypeToCode(type, member, reference, additionalSeen)))
              .join('\n\n')
        : codeSample;
}

export function getNavigationDataFromPath([basePath, ...path]: NavigationPath[], specialType?: SpecialTypesMap) {
    const baseHash = `reference-${basePath.type}`;
    const data: NavigationData = {
        pathname: basePath.name,
        hash: baseHash,
        pageTitle: { name: basePath.type },
        pageInterface: basePath.type,
    };
    for (let item = path.shift(); item; item = path.shift()) {
        if (specialType?.[item.type] === 'InterfaceArray' || specialType?.[item.type] === 'InterfaceRecord') {
            const child = path.shift();
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
                if (path.length === 0) {
                    data.hash += '-type';
                }
                continue;
            }
        }
        if (specialType?.[item.type] === 'NestedPage') {
            const child = path.shift();
            if (child) {
                data.pathname += `${item.name}/${child.name}/`;
                data.hash = `reference-${child.type}`;
                data.pageTitle = { name: child.name };
                data.pageInterface = child.type;
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
    if (interfaceRef?.kind === 'interface' || (interfaceRef?.kind === 'typeLiteral' && interfaceRef.name)) {
        const { genericsMap } = interfaceRef as HasProperty<NodeTypes, 'genericsMap'>;
        return interfaceRef.members.flatMap((member) => {
            const newPath = { name: cleanupName(member.name), type: getMemberType(member) };
            if (basePath.find((p) => p.name === newPath.name && p.type === newPath.type)) {
                return [];
            }

            const navPath = basePath.concat(newPath);
            const results = [
                {
                    label: labelPrefix + cleanupName(member.name),
                    searchable: cleanupName(member.name).toLowerCase(),
                    navPath,
                },
            ];
            if (typeof member.type === 'string' && reference?.has(genericsMap?.[member.type] ?? member.type)) {
                results.push(
                    ...extractSearchData(
                        reference,
                        reference.get(genericsMap?.[member.type] ?? member.type),
                        navPath,
                        `${labelPrefix}${cleanupName(member.name)}.`
                    )
                );
            } else if (
                typeof member.type === 'object' &&
                'type' in member.type &&
                typeof member.type.type === 'string' &&
                reference?.has(member.type.type)
            ) {
                results.push(
                    ...extractSearchData(
                        reference,
                        reference.get(member.type.type),
                        navPath,
                        `${labelPrefix}${cleanupName(member.name)}.`
                    )
                );
            }
            return results;
        });
    }

    if (
        interfaceRef?.kind === 'typeAlias' &&
        typeof interfaceRef.type === 'object' &&
        interfaceRef.type.kind === 'union'
    ) {
        return interfaceRef.type.type
            .flatMap((typeName) => {
                if (typeof typeName === 'string' && !isInterfaceHidden(typeName)) {
                    const subtypeRef = reference?.get(typeName);
                    if (subtypeRef?.kind === 'interface') {
                        const typeMember = subtypeRef.members.find((member) => member.name === 'type');
                        if (typeMember) {
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
                    }
                }
            })
            .filter((item): item is SearchDatum => Boolean(item));
    }

    return [];
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

export function getOptionsStaticPaths(reference: ApiReferenceType) {
    const getSubTypes = (ref: NodeTypes): string[] =>
        ref.kind === 'typeAlias' && typeof ref.type === 'object' && ref.type.kind === 'union'
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

export function parseJsDocs(docs?: string[]) {
    return docs?.join('\n').replaceAll(/^@([a-z])/gm, (_, char) => char.toUpperCase());
}
