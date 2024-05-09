import type { ApiReferenceType } from '@features/api-documentation/api-reference-types';
import { getDevFileUrl } from '@utils/devFileUrl';
import { updateInterfaceReferences } from '@utils/updateInterfaceReferences';

/**
 * Get interfaces reference by fetching from the dev files url
 */
export async function fetchInterfacesReference(): Promise<ApiReferenceType> {
    const contents = await fetch(
        getDevFileUrl({
            filePath: '/resolved-interfaces.json',
        })
    ).then((res) => res.json());

    return updateInterfaceReferences(contents);
}
