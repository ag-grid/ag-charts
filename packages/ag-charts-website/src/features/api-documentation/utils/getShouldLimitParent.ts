import { isPathExactMatch } from '@utils/isPathExactMatch';
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
        const propertyPath = property.split('.');
        const hasWildcardEnd = propertyPath[propertyPath.length - 1] === '*';
        const pathLongerThanPropertyMatcher = path.length + 1 > propertyPath.length;
        const isWildcardEndMatch = hasWildcardEnd && pathLongerThanPropertyMatcher;

        if (isPathExactMatch({ path, pathItem, pathMatcher: property }) || isWildcardEndMatch) {
            shouldLimitParent = true;
            break;
        }
    }

    return shouldLimitParent;
}
