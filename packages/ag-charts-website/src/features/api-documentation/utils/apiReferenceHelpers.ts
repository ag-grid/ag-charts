import type { ApiReferenceNode, ApiReferenceType, MemberNode, TypeNode } from '../api-reference-types';

type PossibleTypeNode = TypeNode | undefined | PossibleTypeNode[];

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
        return `type ${apiNode.name} = ${normalizeType(apiNode.type)};`;
    }

    if (apiNode.kind === 'member' && typeof apiNode.type === 'object') {
        if (apiNode.type.kind === 'union') {
            return `type ${apiNode.name} = ${apiNode.type.type.map((type) => normalizeType(type)).join(' | ')};`;
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
