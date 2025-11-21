import { TypeResolver } from './type-resolver';
import type { InterfaceNode, MemberNode, NodeTypes } from './types';

/**
 * Patch doc interfaces for the front end
 */
export function patchDocInterfaces(typeResolver: TypeResolver) {
    patchAgChartOptionsReference(typeResolver);
    for (const [key, node] of typeResolver.entries()) {
        // TODO support enums in the docs
        if (node.kind === 'enum') {
            typeResolver.set(key, {
                kind: 'typeAlias',
                name: node.name,
                type: {
                    kind: 'union',
                    type: Object.values(node.members),
                },
            });
        }
    }
    return typeResolver;
}

function getTypeUnion(typeRef: NodeTypes | undefined): string[] {
    if (typeRef?.kind === 'typeAlias') {
        if (typeof typeRef.type === 'string') {
            return [typeRef.type];
        }
        if (typeof typeRef.type === 'object' && typeRef.type.kind === 'union') {
            const result: string[] = [];
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
            return result;
        }
    } else if (typeRef?.kind === 'interface') {
        return [typeRef.name];
    }
    return [];
}

function readMemberName(member: MemberNode): string | undefined {
    if (typeof member.type === 'object' && (member.type.kind === 'array' || member.type.kind === 'typeRef')) {
        if (typeof member.type.type === 'string') {
            return member.type.type;
        } else if (member.type.type.kind === 'typeRef') {
            return member.type.type.type;
        }
    }
    return undefined;
}

function patchAgChartOptionsReference(typeResolver: TypeResolver) {
    const interfaceRef = typeResolver.get('AgChartOptions');
    if (interfaceRef == null) {
        throw new Error('Failed to find AgChartOptions reference type');
    }

    const unsupportedMembers: MemberNode[] = [];
    const specialOptions: { axes: string[]; series: string[] } = { axes: [], series: [] };

    let altInterface: InterfaceNode | null = null;

    for (const typeName of getTypeUnion(interfaceRef)) {
        const typeRef = typeResolver.get(typeName);

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
                continue;
            }

            const memberType = typeResolver.get(memberTypeName);
            if (memberType == null) {
                console.error(`Cannot find member ${memberTypeName} for ${member.name}`);
                continue;
            }

            let union: string[] = [];

            if (member.name === 'axes') {
                const axis = typeResolver.get(memberTypeName.replace('Axes', 'Axis'));
                union = (axis as any)?.type.type.map((t) => t.type);
            } else {
                union = getTypeUnion(memberType);
            }
            options.push(...union);

            for (const subType of union) {
                const subInterfaceRef = typeResolver.get(subType);
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

    if (altInterface === null) {
        throw new Error('Failed to initialise altInterface');
    }
    if (unsupportedMembers.length > 0) {
        console.error('Detected unsupported members', unsupportedMembers);
        throw new Error('Failed to patch options due to unsupported members');
    }

    typeResolver.set('AgChartAxesOptions', {
        kind: 'typeAlias',
        name: 'AgChartAxesOptions',
        type: { kind: 'union', type: specialOptions.axes },
    });
    typeResolver.set('AgChartSeriesOptions', {
        kind: 'typeAlias',
        name: 'AgChartSeriesOptions',
        type: { kind: 'union', type: specialOptions.series },
    });

    typeResolver.set('AgChartOptions', {
        ...altInterface,
        name: 'AgChartOptions',
        members: altInterface.members.map((member) => {
            if (typeof member.type !== 'object') {
                return member;
            }
            if (member.name === 'axes') {
                return Object.assign({}, member, {
                    type: Object.assign({}, member.type, { type: 'AgChartAxesOptions' }),
                });
            }
            if (member.name === 'series') {
                return Object.assign({}, member, {
                    type: Object.assign({}, member.type, { type: 'AgChartSeriesOptions' }),
                });
            }
            return member;
        }),
        typeParams: undefined,
        genericsMap: undefined,
    });
}
