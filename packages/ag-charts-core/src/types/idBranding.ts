// Branded string: This is used to ensure type safety by disallowing `something.id` to be mistakeningly assigned to a
// general-purpose string.
//
// Example:
//
//   doSomething(seriesId: SeriesID, axisId: AxisID): void;
//
// Calling `doSomething(axisId, seriesId)` will break compilation, because IDs are the wrong way around.

const elementIDBrand = Symbol('ElementID');
const axisIDBrand = Symbol('AxisID');

export type ElementID = string & { readonly [elementIDBrand]: true };
export type AxisID = string & { readonly [axisIDBrand]: true };
