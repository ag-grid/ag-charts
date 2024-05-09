import type { ApiReferenceNode } from '@features/api-documentation/api-reference-types';

import hiddenApiOptions from './hidden-api-options.json';

export function updateInterfaceReferences(content: any) {
    const interfacesReference = new Map<string, ApiReferenceNode>(
        content.map((item: { name: string }) => [item.name, item])
    );

    for (const [interfaceName, hiddenKeys] of Object.entries(hiddenApiOptions)) {
        removeMembersFromInterface(interfacesReference.get(interfaceName), hiddenKeys);
    }

    return interfacesReference;
}

function removeMembersFromInterface(reference: ApiReferenceNode | undefined, keys: string[]) {
    if (reference?.kind !== 'interface') return;

    reference.members = reference.members.filter((member) => !keys.includes(member.name));
}
