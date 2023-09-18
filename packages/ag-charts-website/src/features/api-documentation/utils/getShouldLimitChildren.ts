import type { JsObjectPropertiesViewConfig } from '../types';

const PROPERTY_SEPARATOR = '.';

export function getShouldLimitChildren({
    config,
    path,
    pathItem,
}: {
    config?: JsObjectPropertiesViewConfig;
    path: string[];
    pathItem: string;
}): boolean {
    const limitChildrenProperties = config?.limitChildrenProperties;

    if (!limitChildrenProperties) {
        return false;
    }

    let shouldLimitChildren = false;
    limitChildrenProperties.map((property) => {
        const propertyPath = property.split(PROPERTY_SEPARATOR);
        const lastPathItem = propertyPath[propertyPath.length - 1];
        const hasWildcard = lastPathItem === '*';
        const prePath = propertyPath.slice(0, propertyPath.length - 1);

        if (JSON.stringify(path) === JSON.stringify(prePath)) {
            if (hasWildcard) {
                shouldLimitChildren = true;
            } else {
                if (lastPathItem === pathItem) {
                    shouldLimitChildren = true;
                }
            }
        }
    });

    return shouldLimitChildren;
}
