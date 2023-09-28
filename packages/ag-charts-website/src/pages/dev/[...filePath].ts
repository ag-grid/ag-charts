import { type DevFileRoute, getDevFiles } from '@utils/pages';
import fsOriginal from 'node:fs';
import fs from 'node:fs/promises';

export function getStaticPaths() {
    return getDevFiles();
}

/**
 * Get files for dev server
 */
export async function get({ props }: DevFileRoute) {
    const { fullFilePath } = props;

    const fileExists = fsOriginal.existsSync(fullFilePath);
    if (fileExists) {
        const body = await fs.readFile(fullFilePath, 'utf-8');
        return {
            body,
        };
    } else {
        // Show error on dev console when file is loaded
        const body = `throw new Error("File does not exist: '${fullFilePath}'. You may need to generate it, or try reloading again.");`;
        return {
            body,
        };
    }
}
