import type { JsonArray, JsonModel, JsonObjectProperty, JsonUnionType } from '@features/api-documentation/utils/model';

import { UNION_DISCRIMINATOR_PROP } from '../constants';
import type { JsObjectPropertiesViewConfig, JsObjectSelection, JsObjectSelectionProperty } from '../types';
import { getShouldLimitChildren } from './getShouldLimitChildren';
import { getShouldLimitParent } from './getShouldLimitParent';

/*
 * Get regex to extract the path item regex if it has a discriminator value
 *
 * Format specified in `getUnionNestedObjectPathItem`.
 */
export function createUnionNestedObjectPathItemRegex(
    { discriminatorProp = UNION_DISCRIMINATOR_PROP }: { discriminatorProp?: string } = {
        discriminatorProp: UNION_DISCRIMINATOR_PROP,
    }
) {
    return new RegExp(`^(\\[${discriminatorProp} = ')(.*)('\\])$`);
}

function getUnionNestedObjectPathItem({
    discriminatorProp,
    value,
    fallbackValue,
}: {
    discriminatorProp: string;
    value: string | null;
    fallbackValue?: string;
}) {
    return value ? `[${discriminatorProp} = ${value}]` : `[${fallbackValue === undefined ? '' : fallbackValue}]`;
}

export function getUnionPathInfo({
    discriminatorProp = UNION_DISCRIMINATOR_PROP,
    model,
    index,
}: {
    discriminatorProp?: string;
    model: JsonModel;
    index: number;
}) {
    const discriminator = model.properties[discriminatorProp];
    const discriminatorType =
        discriminator && discriminator.desc.type === 'primitive' ? discriminator.desc.tsType : null;
    const pathItem = getUnionNestedObjectPathItem({
        discriminatorProp,
        value: discriminatorType,
        fallbackValue: index.toString(),
    });

    return {
        pathItem,
        discriminatorType,
        discriminatorProp,
        discriminator,
    };
}

function getTopLevelNestedObject({ model, path }: { model: JsonModel; path: string[] }) {
    let topLevelModel = model;
    for (let i = 0; i < path.length; i++) {
        const item = path[i];
        const propertyObj = topLevelModel.properties[item];
        const { type } = propertyObj.desc;

        if (type === 'nested-object') {
            topLevelModel = propertyObj.desc.model;
        } else if (type === 'primitive') {
            // Keep top level nested object as is
        } else {
            // eslint-disable-next-line no-console
            console.warn(`Top level nested object type not supported: ${type}`, { model, path });
            break;
        }
    }

    return topLevelModel;
}

function pathMatches({ pathMatcher, pathToCheck }: { pathMatcher: string[]; pathToCheck: string[] }): boolean {
    let doesMatch = false;
    for (let i = 0; i < pathMatcher.length; i++) {
        const matchItem = pathMatcher[i];
        const checkItem = pathToCheck[i];
        const isWildcard = matchItem === '*';

        doesMatch = isWildcard ? true : matchItem === checkItem;

        if (!doesMatch) {
            break;
        }
    }

    return doesMatch;
}

export function getLastTopLevelPath({
    path,
    pathItem,
    config,
}: {
    path: string[];
    pathItem: string;
    config?: JsObjectPropertiesViewConfig;
}): string[] {
    const topLevelParentProperties = config?.topLevelParentProperties;
    if (!topLevelParentProperties) {
        // Default to top level path item if not in config
        const [topLevelPathItem] = path;
        return topLevelPathItem ? [topLevelPathItem] : [];
    }

    const checkPath = path.concat(pathItem);
    let topLevelPath: string[] = [];
    topLevelParentProperties.forEach((property, index) => {
        const propertyPath = property.split('.');

        if (
            pathMatches({
                pathMatcher: propertyPath,
                pathToCheck: checkPath,
            })
        ) {
            const propertyPathLength = propertyPath.length;
            if (propertyPathLength > topLevelPath.length) {
                topLevelPath = checkPath.slice(0, propertyPathLength);
            }
        }
    });

    return topLevelPath;
}

export function getTopLevelSelection({
    selection,
    model,
    config,
}: {
    selection: JsObjectSelection;
    model: JsonModel;
    config?: JsObjectPropertiesViewConfig;
}): JsObjectSelection | undefined {
    const [topLevelPathItem] = selection.path;
    const topLevelName = topLevelPathItem || (selection as JsObjectSelectionProperty).propName;
    const topLevelModel = model.properties[topLevelName];

    if (selection.isRoot) {
        return {
            type: 'model',
            path: selection.path,
            model: selection.model,
            isRoot: true,
        };
    } else if (!topLevelModel) {
        return;
    }

    const pathItem = (selection as JsObjectSelectionProperty).propName;
    const shouldLimitChildren = getShouldLimitChildren({
        config,
        path: selection.path,
        pathItem,
    });
    const shouldLimitParent = getShouldLimitParent({
        config,
        path: selection.path,
        pathItem: (selection as JsObjectSelectionProperty).propName,
    });

    let topLevelSelection: JsObjectSelection;
    if (selection.path.length === 0) {
        topLevelSelection = {
            type: 'property',
            path: [],
            propName: (selection as JsObjectSelectionProperty).propName,
            model: topLevelModel,
        };
    } else if (shouldLimitChildren || shouldLimitParent) {
        if (selection.type === 'property') {
            if (topLevelModel.desc.type === 'array') {
                const { path } = selection;
                // Top level array should only take the first 2 items from path
                const topLevelPath = selection.path.slice(0, 2);
                const topLevelArray = (topLevelModel.desc as JsonArray).elements as JsonUnionType;
                const pathDiscriminator = path[1];

                const regex = createUnionNestedObjectPathItemRegex();
                const [_, _preValue, value] = regex.exec(pathDiscriminator) || [];

                const innerOption = topLevelArray.options.find((option) => {
                    const jsonObjectOption = option as JsonObjectProperty;
                    return (
                        (jsonObjectOption.model as JsonModel).properties[UNION_DISCRIMINATOR_PROP].desc.tsType ===
                        `'${value}'`
                    );
                }) as JsonObjectProperty;

                topLevelSelection = {
                    type: 'model',
                    path: topLevelPath,
                    model: innerOption.model,
                };
            } else if (topLevelModel.desc.type === 'nested-object') {
                const { propName } = selection;
                const path = getLastTopLevelPath({
                    config,
                    path: selection.path,
                    pathItem: propName,
                });
                const topLevelObject = getTopLevelNestedObject({
                    model,
                    path,
                });

                topLevelSelection = {
                    type: 'model',
                    path,
                    model: topLevelObject,
                };
            }
        } else if (selection.type === 'unionNestedObject') {
            const topLevelArray = (topLevelModel.desc as JsonArray).elements as JsonUnionType;
            const { index } = selection;

            const innerOption = topLevelArray.options[index] as JsonObjectProperty;

            const { pathItem } = getUnionPathInfo({ model: innerOption.model, index });
            const path = selection.path.concat(pathItem);
            topLevelSelection = {
                type: 'model',
                path,
                model: innerOption.model,
            };
        }

        if (!topLevelSelection!) {
            throw new Error('No top level selection found');
        }
    } else {
        topLevelSelection = {
            type: 'property',
            path: [],
            propName: topLevelPathItem,
            model: topLevelModel,
        };
    }

    return topLevelSelection;
}

export function getTopSelection({
    model,
    hideChildren,
}: {
    model: JsonModel;
    hideChildren?: boolean;
}): JsObjectSelection {
    return {
        type: model.type,
        path: [],
        model,
        onlyShowToDepth: hideChildren ? 0 : undefined,
        isRoot: true,
    };
}

export function getFullPath(selection: JsObjectSelection) {
    return selection.type === 'property' ? selection.path.concat(selection.propName) : selection.path;
}
