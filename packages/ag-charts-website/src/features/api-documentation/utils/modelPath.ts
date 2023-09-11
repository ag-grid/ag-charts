import type { JsonArray, JsonModel, JsonObjectProperty, JsonUnionType } from '@features/api-documentation/utils/model';
import type { JsObjectSelection } from '../types';
import { TOP_LEVEL_OPTIONS_TO_LIMIT_CHILDREN, UNION_DISCRIMINATOR_PROP } from '../constants';

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

export function getTopLevelSelection({
    selection,
    model,
}: {
    selection: JsObjectSelection;
    model: JsonModel;
}): JsObjectSelection | undefined {
    const [topLevelPathItem] = selection.path;
    const topLevelModel = model.properties[topLevelPathItem];
    if (!topLevelModel) {
        return;
    }

    const shouldLimitChildren = TOP_LEVEL_OPTIONS_TO_LIMIT_CHILDREN.includes(topLevelPathItem);
    if (shouldLimitChildren) {
        let innerOption: JsonObjectProperty;
        let path = selection.path;
        if (selection.type === 'property') {
            const topLevelArray = (topLevelModel.desc as JsonArray).elements as JsonUnionType;
            const pathDiscriminator = selection.path[1];

            const regex = createUnionNestedObjectPathItemRegex();
            const [_, _preValue, value] = regex.exec(pathDiscriminator) || [];

            innerOption = topLevelArray.options.find((option) => {
                const jsonObjectOption = option as JsonObjectProperty;
                return (
                    (jsonObjectOption.model as JsonModel).properties[UNION_DISCRIMINATOR_PROP].desc.tsType ===
                    `'${value}'`
                );
            }) as JsonObjectProperty;
        } else if (selection.type === 'unionNestedObject') {
            const topLevelArray = (topLevelModel.desc as JsonArray).elements as JsonUnionType;
            const { index } = selection;

            innerOption = topLevelArray.options[index] as JsonObjectProperty;

            const { pathItem } = getUnionPathInfo({ model: innerOption.model, index });
            path = selection.path.concat(pathItem);
        }

        if (!innerOption!) {
            throw new Error('No inner option found');
        }

        return {
            type: 'model',
            path,
            model: innerOption.model,
        };
    }

    return {
        type: 'property',
        path: [],
        propName: topLevelPathItem,
        model: topLevelModel,
    };
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
    };
}
