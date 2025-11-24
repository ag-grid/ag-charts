import { TypeMapper } from './type-mapper';
import { InterfaceNode, MemberNode, MultiTypeNode, NodeTypes, TypeNode, TypeReferenceNode } from './types';

export class TypeResolver {
    protected nodeMap: Map<string, NodeTypes> = new Map();
    protected genericsMap: Map<string, TypeNode>;

    constructor(protected typeMapper: TypeMapper) {
        for (const [name] of typeMapper.entries()) {
            this.genericsMap = new Map();
            try {
                this.nodeMap.set(name, this.resolveType(name));
            } catch (e) {
                console.error('Failed to resolve', name);
            }
        }
    }

    entries() {
        return this.nodeMap.entries();
    }

    get(key: string) {
        return this.nodeMap.get(key);
    }

    set(key: string, value: NodeTypes) {
        return this.nodeMap.set(key, value);
    }

    toJSON() {
        return Object.fromEntries(Array.from(this.nodeMap.entries()).sort());
    }

    protected resolveType(node: TypeNode, typeArguments?: TypeNode[]) {
        if (typeof node === 'string') {
            const mapItem = this.typeMapper.get(node);
            if (mapItem) {
                return this.resolveNode(mapItem, typeArguments);
            }
            const genericItem = this.genericsMap.get(node);
            if (genericItem) {
                return this.resolveType(genericItem, typeArguments);
            }
            console.error('Missing!', node);
        } else if (node.kind === 'typeRef') {
            return this.resolveBuiltInType(node);
        } else {
            return this.resolveNode(node, typeArguments);
        }
    }

    protected resolveBuiltInType(node: TypeReferenceNode) {
        const { typeArguments } = node;

        switch (node.type) {
            case 'NonNullable':
                return this.resolveType(typeArguments![0]);

            case 'Required':
            case 'Partial': {
                const optional = node.type === 'Partial';
                const n = this.resolveType(typeArguments![0]);
                return { ...n, members: n.members.map((member: MemberNode) => ({ ...member, optional })) };
            }

            case 'Omit':
            case 'Pick': {
                const typeArgument = typeArguments![0];
                const typeKeys = this.resolveUnion(typeArguments![1]);
                const expectedFilter = node.type === 'Pick';
                const matchType =
                    typeKeys.kind === 'union'
                        ? (m: any) => typeKeys.type.includes(`'${m.name}'`) === expectedFilter
                        : (m: any) => ((typeKeys.type ?? typeKeys) === `'${m.name}'`) === expectedFilter;
                const n = this.resolveType(typeof typeArgument === 'string' ? typeArgument : typeArgument.type);

                if (typeof typeArgument !== 'string') {
                    const size = Math.min(typeArgument.typeArguments?.length ?? 0, n.typeParams?.length ?? 0);
                    for (let i = 0; i < size; i++) {
                        this.genericsMap.set(n.typeParams[i].name, typeArgument.typeArguments![i]);
                    }
                }

                return { ...n, members: n.members.filter(matchType) };
            }
        }
    }

    protected resolveUnion(unionKey: TypeNode) {
        if (typeof unionKey === 'string') {
            if (unionKey.startsWith("'") && unionKey.endsWith("'")) {
                return unionKey;
            }
            const resolved = this.resolveType(unionKey);
            if (typeof resolved === 'object') {
                return this.resolveUnion(resolved.type);
            }
        } else if (unionKey?.kind === 'union') {
            unionKey.type = unionKey.type.flatMap((type: string | MultiTypeNode) => {
                const resolved = this.resolveUnion(type);
                return typeof resolved === 'object' ? this.resolveUnion(resolved.type) : [resolved];
            });
        }
        return unionKey;
    }

    protected resolveNode(node: NodeTypes, typeArguments?: TypeNode[]) {
        if ('typeParams' in node) {
            // Build a map of generic type parameters to their resolved types
            node.typeParams?.forEach((param, index) => {
                const value = typeArguments?.[index] ?? param.default;
                if (value && param.name !== value) {
                    this.genericsMap.set(param.name, value);
                }
            });
        }

        if (node.kind === 'indexAccess') {
            const { members } = this.resolveType(node.type);
            const memberName = removeStringQuotes(node.index);
            const { type } = members.find((member: MemberNode) => member.name === memberName);
            return this.resolveType(type);
        }

        if (node.kind === 'typeAlias' && typeof node.type === 'object') {
            const { kind, type, ...rest } = node;
            switch (node.type.kind) {
                case 'typeLiteral':
                    return this.resolveType({ name: node.name, ...node.type });

                case 'typeRef':
                    return this.resolveNode(
                        { ...rest, kind: 'interface', members: [], heritage: [type] },
                        typeArguments
                    );

                case 'intersection':
                    return this.resolveNode(
                        {
                            ...rest,
                            kind: 'interface',
                            members: [],
                            heritage: node.type.type.filter((subType: TypeNode) => {
                                if (typeof subType === 'object') {
                                    if (subType.kind === 'typeLiteral') {
                                        return true;
                                    }
                                    if (subType.kind === 'typeRef') {
                                        subType = subType.type;
                                    }
                                }
                                if (typeof subType === 'string') {
                                    return !subType.match(/^['{].*['}]$/);
                                }
                                return true;
                            }),
                        },
                        typeArguments
                    );
            }
        }

        if (node.kind === 'interface' && node.heritage?.length) {
            node.members ??= [];
            for (const h of node.heritage as any[]) {
                if (typeof h === 'string' || this.typeMapper.has(h.type)) {
                    const n = typeof h === 'string' ? this.resolveType(h) : this.resolveType(h.type, h.typeArguments);
                    if (Array.isArray(n.members)) {
                        node.members.push(...n.members);
                    }
                } else if (h.type === 'Omit' || h.type === 'Pick' || h.type === 'Required' || h.type === 'Partial') {
                    const n = this.resolveBuiltInType(h);
                    node.members.push(...n.members);
                } else if (h.type === 'Readonly') {
                    const n = this.resolveType({ kind: 'typeRef', type: h.typeArguments![0] });
                    node.members.push(...n.members);
                } else if (h.kind === 'typeLiteral') {
                    if (Array.isArray(h.members)) {
                        node.members.push(...h.members);
                    }
                } else if (h.type === 'Record') {
                    const n = this.resolveType(h.typeArguments![1].type, h.typeArguments![1].typeArguments);
                    node.members.push(...n.type.type.filter((t) => t.kind === 'typeRef'));
                } else {
                    console.warn(`Unhandled type "${h.type}" on ${node.name}`, h, this.typeMapper.has(h.type));
                    throw Error(`Unhandled type "${h.type}" on ${node.name}`);
                }
            }
        }

        if ('members' in node && Array.isArray(node.members)) {
            node.members = cleanupMembers(node.members);
        }

        if (this.genericsMap.size) {
            (node as InterfaceNode).genericsMap = Object.fromEntries(this.genericsMap);
        }

        return node;
    }
}

function removeStringQuotes(str: string) {
    return str.replace(/^'(.*)'$/, '$1');
}

// Remove duplicates and push required members to the top of the list
function cleanupMembers(members: MemberNode[]) {
    return members
        .filter(({ name, docs }, index) => {
            const firstMatchIndex = members.findIndex((item) => item.name === name);
            const isFirstAppearance = firstMatchIndex === index;
            if (!isFirstAppearance) {
                const existingMember = members[firstMatchIndex];
                existingMember.docs ??= docs;
            }
            return isFirstAppearance;
        })
        .filter(({ docs }) => !docs?.some((d) => d.includes('@deprecated') || d.includes('@experimental')))
        .map((member) => {
            // TODO - handle default values in the docs website, not here
            const matchDefault = member.docs?.at(-1)?.match(/^\s*Default:\s*`([^`]+)`\s*$/);
            if (matchDefault) {
                member.defaultValue = matchDefault[1];
                member.docs!.pop();
                if (member.docs!.at(-1) === '') {
                    member.docs!.pop();
                }
            }
            return member;
        })
        .sort(sortByRequired)
        .sort(sortByPriority);
}

function sortByRequired(a: MemberNode, b: MemberNode) {
    if (a.optional && !b.optional) return 1;
    if (!a.optional && b.optional) return -1;
    return 0;
}

const prioritisedMembers = ['type', 'showOn'];
function sortByPriority(a: MemberNode, b: MemberNode) {
    if (prioritisedMembers.includes(a.name)) return -1;
    if (prioritisedMembers.includes(b.name)) return 1;
    return 0;
}
