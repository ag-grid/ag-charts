import type { JsObjectPropertiesViewConfig } from '../types';

const PROPERTY_SEPARATOR = '.';

export function getShouldLimitChildren({
    config,
    path,
    pathItem,
}: {
    config?: JsObjectPropertiesViewConfig;
    path: string[];
    pathItem?: string;
}): boolean {
    const limitChildrenProperties = config?.limitChildrenProperties;

    if (!limitChildrenProperties) {
        return false;
    }

    const checkPath = pathItem === undefined ? path : path.concat(pathItem);
    const checkPrePath = checkPath.slice(0, checkPath.length - 1);
    const lastCheckPathItem = checkPath[checkPath.length - 1];
    let shouldLimitChildren = false;
    limitChildrenProperties.map((property) => {
        const propertyPath = property.split(PROPERTY_SEPARATOR);
        const lastPathItem = propertyPath[propertyPath.length - 1];
        const hasWildcard = lastPathItem === '*';
        const prePath = propertyPath.slice(0, propertyPath.length - 1);

        if (JSON.stringify(checkPrePath) === JSON.stringify(prePath)) {
            if (hasWildcard) {
                shouldLimitChildren = true;
            } else {
                if (lastPathItem === lastCheckPathItem) {
                    shouldLimitChildren = true;
                }
            }
        }
    });

    return shouldLimitChildren;
}
