import type { ApiReferenceType } from '@generate-code-reference-plugin/doc-interfaces/types';
import { getDevFileUrl } from '@utils/devFileUrl';

/**
 * Get interfaces reference by fetching from the dev files url
 */
export async function fetchInterfacesReference(): Promise<ApiReferenceType> {
    const contents = await fetch(
        getDevFileUrl({
            filePath: '/resolved-interfaces.json',
        })
    ).then((res) => res.json());

    return new Map(Object.entries(contents));
}
