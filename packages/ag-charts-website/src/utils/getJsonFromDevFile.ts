import { readFileSync } from 'node:fs';
import { DEV_FILE_PATH_MAP } from './pages';

export function getJsonFromDevFile(devFileKey: keyof typeof DEV_FILE_PATH_MAP) {
    const file = DEV_FILE_PATH_MAP[devFileKey];
    const fileContents = readFileSync(file).toString();

    return file && fileContents ? JSON.parse(fileContents) : undefined;
}
