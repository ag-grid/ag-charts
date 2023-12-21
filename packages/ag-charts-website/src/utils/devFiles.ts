import type { ApiReferenceNode, ApiReferenceType } from '@features/api-documentation/api-reference-types';
import { DEV_FILE_PATH_MAP, getRootUrl } from '@utils/pages';
import { pathJoin } from '@utils/pathJoin';
import { readFileSync } from 'node:fs';

import hiddenApiOptions from './hidden-api-options.json';

type DevFileKey = keyof typeof DEV_FILE_PATH_MAP;

function getJsonFromDevFile(devFileKey: DevFileKey) {
    const file = pathJoin(getRootUrl().pathname, DEV_FILE_PATH_MAP[devFileKey]);
    const fileContents = readFileSync(file).toString();
    return fileContents ? JSON.parse(fileContents) : null;
}

export function getInterfacesReference(): ApiReferenceType {
    const jsonContent = getJsonFromDevFile('resolved-interfaces.json');
    const interfacesReference = new Map<string, ApiReferenceNode>(
        jsonContent.map((item: { name: string }) => [item.name, item])
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
