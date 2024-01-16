import type { DeepPartial } from './types';
/**
 * Performs a recursive JSON-diff between a source and target JSON structure.
 *
 * On a per-property basis, takes the target property value where:
 * - types are different.
 * - type is primitive.
 * - type is array and length or content have changed.
 *
 * @param source starting point for diff
 * @param target target for diff vs. source
 *
 * @returns `null` if no differences, or an object with the subset of properties that have changed.
 */
export declare function jsonDiff<T extends unknown>(source: T, target: T): Partial<T> | null;
export declare function jsonClone<T>(source: T): T;
/**
 * Special value used by `jsonMerge` to signal that a property should be removed from the merged
 * output.
 */
export declare const DELETE: unique symbol;
export interface JsonMergeOptions {
    /**
     * Contains a list of properties where deep clones should be avoided
     */
    avoidDeepClone: string[];
}
/**
 * Merge together the provide JSON object structures, with the precedence of application running
 * from higher indexes to lower indexes.
 *
 * Deep-clones all objects to avoid mutation of the inputs changing the output object. For arrays,
 * just performs a deep-clone of the entire array, no merging of elements attempted.
 *
 * @param json all json objects to merge
 * @param opts merge options
 * @param opts.avoidDeepClone contains a list of properties where deep clones should be avoided
 *
 * @returns the combination of all the json inputs
 */
export declare function jsonMerge<T>(json: T[], opts?: JsonMergeOptions): T;
export type JsonApplyParams = {
    constructors?: Record<string, new () => any>;
    constructedArrays?: WeakMap<Array<any>, new () => any>;
    allowedTypes?: Record<string, ReturnType<typeof classify>[]>;
};
/**
 * Recursively apply a JSON object into a class-hierarchy, optionally instantiating certain classes
 * by property name.
 *
 * @param target to apply source JSON properties into
 * @param source to be applied
 * @param params
 * @param params.path path for logging/error purposes, to aid with pinpointing problems
 * @param params.matcherPath path for pattern matching, to lookup allowedTypes override.
 * @param params.skip property names to skip from the source
 * @param params.constructors dictionary of property name to class constructors for properties that
 *                            require object construction
 * @param params.constructedArrays map stores arrays which items should be initialised
 *                                 using a class constructor
 * @param params.allowedTypes overrides by path for allowed property types
 */
export declare function jsonApply<Target extends object, Source extends DeepPartial<Target>>(target: Target, source?: Source, params?: {
    path?: string;
    matcherPath?: string;
    skip?: string[];
    idx?: number;
} & JsonApplyParams): Target;
/**
 * Walk the given JSON object graphs, invoking the visit() callback for every object encountered.
 * Arrays are descended into without a callback, however their elements will have the visit()
 * callback invoked if they are objects.
 *
 * @param json to traverse
 * @param visit callback for each non-primitive and non-array object found
 * @param opts
 * @param opts.skip property names to skip when walking
 * @param jsons to traverse in parallel
 */
export declare function jsonWalk<T>(json: T, visit: (...nodes: T[]) => void, opts?: {
    skip?: string[];
}, ...jsons: T[]): void;
type Classification = RestrictedClassification | 'function' | 'class-instance';
type RestrictedClassification = 'array' | 'object' | 'primitive';
/**
 * Classify the type of value to assist with handling for merge purposes.
 */
declare function classify(value: any): Classification | null;
export {};
