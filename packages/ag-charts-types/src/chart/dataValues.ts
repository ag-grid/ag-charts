/**
 * A numeric data value. `bigint` is accepted alongside `number` so that
 * integer values exceeding `Number.MAX_SAFE_INTEGER` can be represented and
 * rendered without loss of precision.
 */
export type AgNumericValue = number | bigint;
