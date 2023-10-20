import { isPathMatch } from '@utils/isPathMatch';

import type { JsObjectPropertiesViewConfig } from '../types';

export function getShouldLimitParent({
    config,
    path,
    pathItem,
}: {
    config?: JsObjectPropertiesViewConfig;
    path: string[];
    pathItem: string;
}) {
    const limitChildrenProperties = config?.limitChildrenProperties;

    if (!limitChildrenProperties) {
        return false;
    }

    let shouldLimitParent = false;
    for (let i = 0; i < limitChildrenProperties.length; i++) {
        const property = limitChildrenProperties[i];
        if (isPathMatch({ path, pathItem, pathMatcher: property })) {
            shouldLimitParent = true;
            break;
        }
    }

    return shouldLimitParent;
}
