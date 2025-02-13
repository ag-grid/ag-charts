import type { ApiReferenceType } from '@generate-code-reference-plugin/doc-interfaces/types';
import { getDevFileUrl } from '@utils/devFileUrl';

import { entries } from 'ag-charts-core';

/**
 * Get interfaces reference by fetching from the dev files url
 */
export async function fetchInterfacesReference() {
    const contents = await fetch(
        getDevFileUrl({
            filePath: '/resolved-interfaces.json',
        })
    ).then((res) => res.json());

    return new Map(entries(contents)) as ApiReferenceType;
}
