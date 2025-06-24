import { HIDDEN_API_INTERFACE_MEMBERS } from './constants';
import type { ApiReferenceNode, ApiReferenceType, InterfaceNode, MemberNode } from './types';

/**
 * Patch doc interfaces for the front end
 */
export function patchDocInterfaces(resolvedEntries: ApiReferenceNode[]) {
    const interfaceReference = updateInterfaceReferences(resolvedEntries);
    patchAgChartOptionsReference(interfaceReference);
    return interfaceReference;
}

function getTypeUnion(typeRef: ApiReferenceNode | undefined): string[] {
    const result: string[] = [];
    if (typeRef?.kind === 'typeAlias') {
        if (typeof typeRef.type === 'string') {
            return [typeRef.type];
        }
        if (typeof typeRef.type === 'object' && typeRef.type.kind === 'union') {
            const unsupportedSubtypes: typeof typeRef.type.type = [];
            for (const subType of typeRef.type.type) {
                if (typeof subType === 'string') {
                    result.push(subType);
                } else if (subType.kind === 'typeRef') {
                    result.push(subType.type);
                } else {
                    unsupportedSubtypes.push(subType);
                }
            }
            if (unsupportedSubtypes.length > 0) {
                console.error(`unsupported 'typeRef.type.type' values detected`, unsupportedSubtypes);
                throw new Error(`failed to get types of ${typeRef.name}`);
            }
        }
    }
    return result;
}

function readMemberName(member: MemberNode): string | undefined {
    if (typeof member.type === 'object' && member.type.kind === 'array') {
        if (typeof member.type.type === 'string') {
            return member.type.type;
        } else if (member.type.type.kind === 'typeRef') {
            return member.type.type.type;
        }
    }
    return undefined;
}

function patchAgChartOptionsReference(reference: ApiReferenceType) {
    const interfaceRef = reference.get('AgChartOptions');
    if (interfaceRef == null) {
        throw new Error('Failed to find AgChartOptions reference type');
    }

    const unsupportedMembers: MemberNode[] = [];
    const specialOptions: { axes: string[]; series: string[] } = { axes: [], series: [] };

    let altInterface: InterfaceNode | null = null;

    for (const typeName of getTypeUnion(interfaceRef)) {
        const typeRef = reference.get(typeName);

        if (typeRef?.kind !== 'interface') {
            throw Error('Unexpected AgChartOptions union type');
        }

        altInterface ??= typeRef;

        for (const member of typeRef.members) {
            const options = specialOptions[member.name];
            if (options == null) continue;

            const memberTypeName: string | undefined = readMemberName(member);
            if (memberTypeName == null) {
                unsupportedMembers.push(member);
            } else {
                const union = getTypeUnion(reference.get(memberTypeName));
                options.push(...union);

                for (const subType of union) {
                    const subInterfaceRef = reference.get(subType);
                    if (subInterfaceRef == null) {
                        console.error('Cannot find API reference for', subType);
                        unsupportedMembers.push(member);
                    } else if (subInterfaceRef.kind !== 'interface') {
                        console.error(`Unexpected kind: ${subInterfaceRef.kind} for ${subType}`);
                        unsupportedMembers.push(member);
                    }
                }
            }
        }
    }

    if (altInterface === null) {
        throw new Error('Failed to initialise altInterface');
    }
    if (unsupportedMembers.length > 0) {
        console.error('Detected unsupported members', unsupportedMembers);
        throw new Error('Failed to patch options due to unsupported members');
    }

    reference.set('AgChartAxisOptions', {
        kind: 'typeAlias',
        name: 'AgChartAxisOptions',
        type: { kind: 'union', type: specialOptions.axes },
    });
    reference.set('AgChartSeriesOptions', {
        kind: 'typeAlias',
        name: 'AgChartSeriesOptions',
        type: { kind: 'union', type: specialOptions.series },
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

    for (const [interfaceName, hiddenKeys] of Object.entries(HIDDEN_API_INTERFACE_MEMBERS)) {
        removeMembersFromInterface(interfacesReference.get(interfaceName), hiddenKeys as string[]);
    }

    return interfacesReference;
}

function removeMembersFromInterface(reference: ApiReferenceNode | undefined, keys: string[]) {
    if (reference?.kind !== 'interface') return;

    reference.members = reference.members.filter((member) => !keys.includes(member.name));
}
