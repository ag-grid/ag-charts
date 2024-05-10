import type { ApiReferenceType } from '@generate-code-reference-plugin/doc-interfaces/types';
import { DEV_FILE_PATH_MAP, getRootUrl } from '@utils/pages';
import { pathJoin } from '@utils/pathJoin';
import { readFileSync } from 'node:fs';

type DevFileKey = keyof typeof DEV_FILE_PATH_MAP;

function getJsonFromDevFile(devFileKey: DevFileKey) {
    const file = pathJoin(getRootUrl().pathname, DEV_FILE_PATH_MAP[devFileKey]);
    const fileContents = readFileSync(file).toString();
    return fileContents ? JSON.parse(fileContents) : null;
}

/**
 * Get interfaces reference from the file system
 *
 * For static site generation
 */
export function getInterfacesReference(): ApiReferenceType {
    const jsonContent = getJsonFromDevFile('resolved-interfaces-patched.json');
    return new Map(Object.entries(jsonContent));
}
