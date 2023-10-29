import type { ApiReferenceNode, ApiReferenceType, InterfaceNode, MemberNode, TypeNode } from '../api-reference-types';

type PossibleTypeNode = TypeNode | undefined | PossibleTypeNode[];

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
