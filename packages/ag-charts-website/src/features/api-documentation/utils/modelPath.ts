import type { JsonModel } from '@features/api-documentation/utils/model';

/**
 * Property key used to differentiate between different union items
 */
export const UNION_DISCRIMINATOR_PROP = 'type';

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
