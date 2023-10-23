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

    const checkPath = !pathItem ? path.slice() : path.concat(pathItem);
    const lastCheckPathItem = checkPath.pop();

    return limitChildrenProperties.some((property) => {
        const propertyPath = property.split(PROPERTY_SEPARATOR);
        const lastPathItem = propertyPath.pop();

        if (JSON.stringify(checkPath) === JSON.stringify(propertyPath)) {
            return lastPathItem === '*' || lastPathItem === lastCheckPathItem;
        }
    });
}
