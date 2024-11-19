import { type DevFileRoute, getDevFiles } from '@utils/pages';
import mime from 'mime';
import fs from 'node:fs/promises';

export function getStaticPaths() {
    return getDevFiles();
}

/**
 * Get files for dev server
 */
export async function GET({ props }: DevFileRoute) {
    const { fullFilePath } = props;

    const mimeType = mime.getType(fullFilePath);

    let body;
    try {
        body = await fs.readFile(fullFilePath);
    } catch (e) {
        if (mimeType !== 'text/javascript') throw e;

        const errorMessage = `File does not exist: '${fullFilePath}'. You may need to generate it, or try reloading again.`;
        body = `throw new Error(${JSON.stringify(errorMessage)});`;
    }

    const headers = new Headers();

    if (mimeType != null) {
        headers.set('Content-Type', mimeType);
    }

    return new Response(body, {
        headers,
    });
}
