export * from './util/angle';
export * from './util/equal';
export * from './util/id';
export * from './util/json';
export * from './util/number';
export * from './util/padding';
export * from './util/sanitize';
export * from './util/value';
export * from './util/zip';

export { isValidDate as isDate, isFiniteNumber as isNumber, isString } from './util/type-guards';
export { bifurcate, extent, normalisedExtent, normalisedExtentWithMetadata } from './util/array';
export { toFixed, isEqual as isNumberEqual } from './util/number';
export { tickFormat } from './util/numberFormat';

export { default as ticks, tickStep, range, isDenseInterval } from './util/ticks';
export { Color } from './util/color';
export type { LabelPlacement, MeasuredLabel, PointLabelDatum, PlacedLabel } from './scene/util/labelPlacement';
export * from './util/logger';

export type { RequireOptional } from './util/types';
