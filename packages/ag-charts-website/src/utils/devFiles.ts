import type { ApiReferenceType } from '@features/api-documentation/api-reference-types';
import { DEV_FILE_PATH_MAP, getRootUrl } from '@utils/pages';
import { pathJoin } from '@utils/pathJoin';
import { readFileSync } from 'node:fs';

type DevFileKey = keyof typeof DEV_FILE_PATH_MAP;

function getJsonFromDevFile(devFileKey: DevFileKey) {
    const file = pathJoin(getRootUrl().pathname, DEV_FILE_PATH_MAP[devFileKey]);
    const fileContents = readFileSync(file).toString();
    return fileContents ? JSON.parse(fileContents) : null;
}

export function getInterfacesReference(): ApiReferenceType {
    const jsonContent = getJsonFromDevFile('resolved-interfaces.json');
    return new Map(jsonContent.map((item: { name: string }) => [item.name, item]));
}
