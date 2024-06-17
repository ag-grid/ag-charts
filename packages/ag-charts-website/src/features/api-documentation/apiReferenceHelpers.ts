import type { ApiReferenceConfig } from '@features/api-documentation/components/ApiReference';
import type {
    ApiReferenceNode,
    ApiReferenceType,
    EnumNode,
    InterfaceNode,
    MemberNode,
    TypeLiteralNode,
    TypeNode,
} from '@generate-code-reference-plugin/doc-interfaces/types';

type PossibleTypeNode = TypeNode | undefined | PossibleTypeNode[];

export type SearchDatum = { label: string; searchable: string; navPath: NavigationPath[] };
export type SpecialTypesMap = Record<string, 'InterfaceArray' | 'NestedPage'>;

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
    'CssColor',
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
    'TimeInterval',
];

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
        return member.type.kind;
    }
    return member.type;
}

export function normalizeType(refType: TypeNode, includeGenerics?: boolean): string {
    if (typeof refType === 'string') {
        return refType;
    }
    switch (refType.kind) {
        case 'array':
            return `${normalizeType(refType.type, includeGenerics)}[]`;
        case 'typeRef':
            return refType.type;
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
    const { prioritise, include, exclude } = config;
    const isInterface = interfaceRef.kind === 'interface';
    const genericsMap = new Map(isInterface ? Object.entries(interfaceRef.genericsMap ?? {}) : null);
    if (isInterface && interfaceRef.typeParams) {
        for (const [i, typeParam] of interfaceRef.typeParams.entries()) {
            genericsMap.set(
                typeParam.name,
                normalizeType(typeArguments?.[i] ?? typeParam.default ?? typeParam.constraint)
            );
        }
    }
    if (include?.length || exclude?.length) {
        members = members.filter(
            (member) => !exclude?.includes(member.name) && (include?.includes(member.name) ?? true)
        );
    }
    if (prioritise) {
        return members.sort((a, b) => (prioritise.includes(a.name) ? -1 : prioritise.includes(b.name) ? 1 : 0));
    }
    return members.map((member) => {
        if (isInterface) {
            const memberType = normalizeType(member.type);
            return genericsMap.has(memberType) ? { ...member, type: genericsMap.get(memberType) } : member;
        }
        return member;
    });
}

export function formatTypeToCode(apiNode: ApiReferenceNode | MemberNode, reference: ApiReferenceType): string {
    if (apiNode.kind === 'interface') {
        return `interface ${apiNode.name} {\n    ${apiNode.members
            .map((member) => {
                const memberString = `${member.name}${member.optional ? '?' : ''}: ${normalizeType(member.type)};`;
                if (member.docs) {
                    return member.docs
                        .map((docsLine: string) => `// ${docsLine}`)
                        .concat(memberString)
                        .join('\n    ');
                }
                return memberString;
            })
            .join('\n    ')}\n}`;
    }

    if (apiNode.kind === 'typeAlias') {
        let nodeType = normalizeType(apiNode.type);
        if (typeof apiNode.type === 'object' && apiNode.type.kind === 'union') {
            nodeType = '\n    ' + nodeType.replaceAll('|', '\n  |');
            return [`type ${apiNode.name} = ${nodeType};`]
                .concat(
                    apiNode.type.type
                        .map((type) => {
                            if (typeof type === 'string' && reference.has(type) && !hiddenInterfaces.includes(type)) {
                                return formatTypeToCode(reference.get(type)!, reference);
                            }
                        })
                        .filter(<T>(x: T | undefined): x is T => Boolean(x))
                )
                .join('\n\n');
        }
        return `type ${apiNode.name} = ${nodeType};`;
    }

    if (apiNode.kind === 'member' && typeof apiNode.type === 'object') {
        if (apiNode.type.kind === 'union') {
            const nodeType =
                '\n    ' +
                apiNode.type.type
                    .map((type) => normalizeType(type))
                    .join(' | ')
                    .replaceAll('|', '\n  |');
            return `type ${apiNode.name} = ${nodeType};`;
        }

        if (apiNode.type.kind === 'function') {
            const additionalTypes = apiNode.type.params
                ?.map((param) => param.type)
                .concat(apiNode.type.returnType)
                .flatMap(function typeMapper(type): PossibleTypeNode {
                    if (typeof type === 'string') {
                        return reference.get(type);
                    }
                    if (type.kind === 'typeRef') {
                        return reference.get(type.type);
                    }
                    if (type.kind === 'union' || type.kind === 'intersection') {
                        return type.type.map(typeMapper);
                    }
                    // eslint-disable-next-line no-console
                    console.warn('Unknown type', type);
                })
                .filter((t): t is Exclude<TypeNode, string> => Boolean(t));

            const params = apiNode.type.params
                ?.map((param) => `${param.name}: ${normalizeType(param.type)}`)
                .join(', ');

            const codeSample = `function ${apiNode.name}(${params ?? ''}): ${normalizeType(apiNode.type.returnType)};`;

            return additionalTypes
                ? [codeSample].concat(additionalTypes.map((type) => formatTypeToCode(type, reference))).join('\n\n')
                : codeSample;
        }
    }

    // eslint-disable-next-line no-console
    console.warn('Unknown API node', apiNode);
    return '';
}

export function getNavigationDataFromPath([basePath, ...path]: NavigationPath[], specialType?: SpecialTypesMap) {
    const data: NavigationData = {
        pathname: basePath.name,
        hash: `reference-${basePath.type}`,
        pageTitle: { name: basePath.type },
        pageInterface: basePath.type,
    };
    for (let item = path.shift(); item; item = path.shift()) {
        if (specialType?.[item.type] === 'InterfaceArray') {
            const child = path.shift();
            if (child) {
                data.pathname += `${item.name}/${child.name}/`;
                data.hash = `reference-${child.type}`;
                data.pageTitle = { name: item.name, type: child.name };
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
    interfaceRef?: ApiReferenceNode,
    basePath: NavigationPath[] = [],
    labelPrefix = ''
): SearchDatum[] {
    if (interfaceRef?.kind === 'interface' || (interfaceRef?.kind === 'typeLiteral' && interfaceRef.name)) {
        return interfaceRef.members.flatMap((member) => {
            const navPath = basePath.concat({ name: cleanupName(member.name), type: getMemberType(member) });
            const results = [
                {
                    label: labelPrefix + cleanupName(member.name),
                    searchable: cleanupName(member.name).toLowerCase(),
                    navPath,
                },
            ];
            if (typeof member.type === 'string' && reference?.has(member.type)) {
                results.push(
                    ...extractSearchData(
                        reference,
                        reference.get(member.type)!,
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
                        reference.get(member.type.type)!,
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
                            const label = `${labelPrefix.replace(/\.$/, '')}[type=${typeMember.type}]`;
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

export function getOptionsStaticPaths(reference: ApiReferenceType) {
    const getSubTypes = (ref: ApiReferenceNode): string[] =>
        ref.kind === 'typeAlias' &&
        typeof ref.type === 'object' &&
        ref.type.kind === 'union' &&
        ref.type.type.every((type): type is string => typeof type === 'string')
            ? ref.type.type
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
                props: { pageInterface, pageTitle: { name: memberName, type } },
            };
        };
    };

    const axesRef = reference.get('AgChartAxisOptions')!;
    const seriesRef = reference.get('AgChartSeriesOptions')!;

    return [
        ...getSubTypes(axesRef).map(createPageMapper('axes')),
        ...getSubTypes(seriesRef).map(createPageMapper('series')),
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
