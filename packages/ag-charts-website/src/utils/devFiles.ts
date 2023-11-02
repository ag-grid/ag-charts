import type { ApiReferenceType } from '@features/api-documentation/api-reference-types';
import { readFileSync } from 'node:fs';

import { DEV_FILE_PATH_MAP } from './pages';

type DevFileKey = keyof typeof DEV_FILE_PATH_MAP;

function getJsonFromDevFile(devFileKey: DevFileKey) {
    const file = DEV_FILE_PATH_MAP[devFileKey];
    const fileContents = readFileSync(file).toString();
    return fileContents ? JSON.parse(fileContents) : null;
}

export function getInterfacesReference(): ApiReferenceType {
    const jsonContent = getJsonFromDevFile('resolved-interfaces.json');
    return new Map(jsonContent.map((item: { name: string }) => [item.name, item]));
}

export function getDeprecatedLookupFiles() {
    const interfaceLookup = getJsonFromDevFile('ag-charts-community/interfaces.AUTO.json');
    const codeLookup = getJsonFromDevFile('ag-charts-community/doc-interfaces.AUTO.json');
    return { interfaceLookup, codeLookup };
}
