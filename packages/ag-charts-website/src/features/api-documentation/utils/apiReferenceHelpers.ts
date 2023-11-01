import type { ApiReferenceNode, ApiReferenceType, InterfaceNode, MemberNode, TypeNode } from '../api-reference-types';

type PossibleTypeNode = TypeNode | undefined | PossibleTypeNode[];

type SearchDatum = { id: string; selection: object };

const hiddenInterfaces = [
    'CssColor',
    'FontStyle',
    'FontWeight',
    'FontSize',
    'FontFamily',
    'Opacity',
    'PixelSize',
    'Ratio',
];

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
        default:
            // eslint-disable-next-line no-console
            console.warn('Unknown type encountered: ', refType);
            return '';
    }
}

export function formatTypeToCode(apiNode: ApiReferenceNode | MemberNode, reference: ApiReferenceType): string {
    if (apiNode.kind === 'interface') {
        return `interface ${apiNode.name} {\n    ${apiNode.members
            .map((member) => {
                const memberString = `${member.name}: ${normalizeType(member.type)};`;
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

export function extractSearchData(
    reference: ApiReferenceType,
    interfaceRef: ApiReferenceNode,
    idPrefix = ''
): SearchDatum[] {
    if (interfaceRef.kind === 'interface' || (interfaceRef.kind === 'typeLiteral' && interfaceRef.name)) {
        return interfaceRef.members.flatMap((member) => {
            const results = [{ id: idPrefix + member.name, selection: {} }];
            if (typeof member.type === 'string' && reference.has(member.type)) {
                results.push(
                    ...extractSearchData(reference, reference.get(member.type)!, `${idPrefix}${member.name}.`)
                );
            } else if (
                typeof member.type === 'object' &&
                member.type.kind === 'array' &&
                typeof member.type.type === 'string' &&
                reference.has(member.type.type)
            ) {
                results.push(
                    ...extractSearchData(reference, reference.get(member.type.type)!, `${idPrefix}${member.name}.`)
                );
            }
            return results;
        });
    }

    if (
        interfaceRef.kind === 'typeAlias' &&
        typeof interfaceRef.type === 'object' &&
        interfaceRef.type.kind === 'union'
    ) {
        return interfaceRef.type.type
            .flatMap((typeName) => {
                if (typeof typeName === 'string' && !isInterfaceHidden(typeName) && reference.has(typeName)) {
                    const subtypeRef = reference.get(typeName)!;
                    if (subtypeRef.kind === 'interface') {
                        const typeMember = subtypeRef.members.find((member) => member.name === 'type');
                        if (typeMember) {
                            return extractSearchData(
                                reference,
                                subtypeRef,
                                `${idPrefix.replace(/\.$/, '')}[type=${typeMember.type}].`
                            );
                        }
                    }
                }
            })
            .filter((item): item is SearchDatum => Boolean(item));
    }

    return [];
}

export function patchAgChartOptionsReference(reference: ApiReferenceType) {
    const interfaceRef = reference.get('AgChartOptions');
    const getTypeUnion = (typeRef: ApiReferenceNode | undefined): string[] => {
        if (typeRef?.kind === 'typeAlias' && typeof typeRef.type === 'object' && typeRef.type.kind === 'union') {
            return typeRef.type.type.filter((type): type is string => typeof type === 'string');
        }
        return [];
    };

    const axisOptions: string[] = [];
    const seriesOptions: string[] = [];

    let altInterface: InterfaceNode | null = null;

    for (const typeName of getTypeUnion(interfaceRef)) {
        const typeRef = reference.get(typeName);

        if (typeRef?.kind !== 'interface') {
            throw Error('Unexpected AgChartOptions union type');
        }

        altInterface ??= typeRef;

        for (const member of typeRef.members) {
            if (
                typeof member.type !== 'object' ||
                member.type.kind !== 'array' ||
                typeof member.type.type !== 'string'
            ) {
                continue;
            }

            if (member.name === 'axes') {
                axisOptions.push(...getTypeUnion(reference.get(member.type.type)));
            } else if (member.name === 'series') {
                seriesOptions.push(...getTypeUnion(reference.get(member.type.type)));
            }
        }
    }

    if (altInterface === null) {
        return;
    }

    reference.set('AgChartAxisOptions', {
        kind: 'typeAlias',
        name: 'AgChartAxisOptions',
        type: { kind: 'union', type: axisOptions },
    });
    reference.set('AgChartSeriesOptions', {
        kind: 'typeAlias',
        name: 'AgChartSeriesOptions',
        type: { kind: 'union', type: seriesOptions },
    });

    altInterface = {
        ...altInterface,
        name: 'AgChartOptions',
        members: altInterface.members.map((member) => {
            if (typeof member.type !== 'object') {
                return member;
            }
            if (member.name === 'axes') {
                return Object.assign({}, member, {
                    type: Object.assign({}, member.type, { type: 'AgChartAxisOptions' }),
                });
            }
            if (member.name === 'series') {
                return Object.assign({}, member, {
                    type: Object.assign({}, member.type, { type: 'AgChartSeriesOptions' }),
                });
            }
            return member;
        }),
    };

    reference.set('AgChartOptions', altInterface);
}

export function getOptionsStaticPaths(reference: ApiReferenceType) {
    patchAgChartOptionsReference(reference);

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
                props: { pageInterface, pageTitle: { memberName, type } },
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
        params: { memberName: member.name },
        props: { pageInterface: member.type, pageTitle: { memberName: member.name } },
    }));
}
