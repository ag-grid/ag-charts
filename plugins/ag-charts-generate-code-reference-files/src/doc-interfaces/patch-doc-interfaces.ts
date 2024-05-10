import { HIDDEN_API_OPTIONS } from './constants';
import type { ApiReferenceNode, ApiReferenceType, InterfaceNode } from './types';

/**
 * Patch doc interfaces for the front end
 */
export function patchDocInterfaces(resolvedEntries: ApiReferenceNode[]) {
    const interfaceReference = updateInterfaceReferences(resolvedEntries);
    patchAgChartOptionsReference(interfaceReference);
    return interfaceReference;
}

function patchAgChartOptionsReference(reference: ApiReferenceType) {
    const interfaceRef = reference.get('AgChartOptions');
    const getTypeUnion = (typeRef: ApiReferenceNode | undefined): string[] => {
        if (typeRef?.kind === 'typeAlias') {
            if (typeof typeRef.type === 'string') {
                return [typeRef.type];
            }
            if (typeof typeRef.type === 'object' && typeRef.type.kind === 'union') {
                return typeRef.type.type.filter((type): type is string => typeof type === 'string');
            }
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
                const axisOption = reference.get(member.type.type);
                // Ignore `groupedCategory` axis, as it is an implementation detail
                const axisOptionUnion = getTypeUnion(axisOption).filter(
                    (name) => name !== 'AgGroupedCategoryAxisOptions'
                );
                axisOptions.push(...axisOptionUnion);
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

function updateInterfaceReferences(content: ApiReferenceNode[]) {
    const interfacesReference = new Map<string, ApiReferenceNode>(
        content.map((item: InterfaceNode) => [item.name, item])
    );

    for (const [interfaceName, hiddenKeys] of Object.entries(HIDDEN_API_OPTIONS)) {
        removeMembersFromInterface(interfacesReference.get(interfaceName), hiddenKeys as string[]);
    }

    return interfacesReference;
}

function removeMembersFromInterface(reference: ApiReferenceNode | undefined, keys: string[]) {
    if (reference?.kind !== 'interface') return;

    reference.members = reference.members.filter((member) => !keys.includes(member.name));
}
