import { Logger } from './logger';
import type { DeepPartial } from './types';

const CLASS_INSTANCE_TYPE = 'class-instance';

/**
 * Performs a JSON-diff between a source and target JSON structure.
 *
 * On a per property basis, takes the target property value where:
 * - types are different.
 * - type is primitive.
 * - type is array and length or content have changed.
 *
 * Recurses for object types.
 *
 * @param source starting point for diff
 * @param target target for diff vs. source
 *
 * @returns `null` if no differences, or an object with the subset of properties that have changed.
 */
export function jsonDiff<T extends unknown>(source: T, target: T): Partial<T> | null {
    const sourceType = classify(source);
    const targetType = classify(target);

    if (targetType === 'array') {
        const targetArray = target as any;
        if (sourceType !== 'array' || (source as any).length !== targetArray.length) {
            return [...targetArray] as any;
        }

        if (
            targetArray.some((targetElement: any, i: number) => jsonDiff((source as any)?.[i], targetElement) != null)
        ) {
            return [...targetArray] as any;
        }

        return null;
    }

    if (targetType === 'primitive') {
        if (sourceType !== 'primitive') {
            return { ...(target as any) };
        }

        if (source !== target) {
            return target;
        }

        return null;
    }

    const lhs = source || ({} as any);
    const rhs = target || ({} as any);

    const allProps = new Set([...Object.keys(lhs), ...Object.keys(rhs)]);

    let propsChangedCount = 0;
    const result: any = {};
    for (const prop of allProps) {
        // Cheap-and-easy equality check.
        if (lhs[prop] === rhs[prop]) {
            continue;
        }

        const take = (v: any) => {
            result[prop] = v;
            propsChangedCount++;
        };

        const lhsType = classify(lhs[prop]);
        const rhsType = classify(rhs[prop]);
        if (lhsType !== rhsType) {
            // Types changed, just take RHS.
            take(rhs[prop]);
            continue;
        }

        if (rhsType === 'primitive' || rhsType === null) {
            take(rhs[prop]);
            continue;
        }

        if (rhsType === 'array' && lhs[prop].length !== rhs[prop].length) {
            // Arrays are different sizes, so just take target array.
            take(rhs[prop]);
            continue;
        }

        if (rhsType === CLASS_INSTANCE_TYPE) {
            // Don't try to do anything tricky with array diffs!
            take(rhs[prop]);
            continue;
        }

        if (rhsType === 'function' && lhs[prop] !== rhs[prop]) {
            take(rhs[prop]);
            continue;
        }

        const diff = jsonDiff(lhs[prop], rhs[prop]);
        if (diff !== null) {
            take(diff);
        }
    }

    return propsChangedCount === 0 ? null : result;
}

/**
 * Special value used by `jsonMerge` to signal that a property should be removed from the merged
 * output.
 */
export const DELETE = Symbol('<delete-property>');

const NOT_SPECIFIED = Symbol('<unspecified-property>');

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
export function jsonMerge<T>(json: T[], opts?: JsonMergeOptions): T {
    const avoidDeepClone = opts?.avoidDeepClone ?? [];
    const jsonTypes = json.map((v) => classify(v));
    if (jsonTypes.some((v) => v === 'array')) {
        // Clone final array.
        const finalValue = json[json.length - 1];
        if (Array.isArray(finalValue)) {
            return finalValue.map((v) => {
                const type = classify(v);

                if (type === 'array') return jsonMerge([[], v], opts);
                if (type === 'object') return jsonMerge([{}, v], opts);

                return v;
            }) as any;
        }

        return finalValue;
    }

    const result: any = {};
    const props = new Set(json.map((v) => (v != null ? Object.keys(v) : [])).reduce((r, n) => r.concat(n), []));

    for (const nextProp of props) {
        const values = json
            .map((j) => {
                if (j != null && typeof j === 'object' && nextProp in j) {
                    return (j as any)[nextProp];
                }
                return NOT_SPECIFIED;
            })
            .filter((v) => v !== NOT_SPECIFIED);

        if (values.length === 0) {
            continue;
        }

        const lastValue = values[values.length - 1];
        if (lastValue === DELETE) {
            continue;
        }

        const types = values.map((v) => classify(v));
        const type = types[0];
        if (types.some((t) => t !== type)) {
            // Short-circuit if mismatching types.
            result[nextProp] = lastValue;
            continue;
        }

        if ((type === 'array' || type === 'object') && !avoidDeepClone.includes(nextProp)) {
            result[nextProp] = jsonMerge(values, opts);
        } else if (type === 'array') {
            // Arrays need to be shallow copied to avoid external mutation and allow jsonDiff to
            // detect changes.
            result[nextProp] = [...lastValue];
        } else {
            // Just directly assign/overwrite.
            result[nextProp] = lastValue;
        }
    }

    return result;
}

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
export function jsonApply<Target extends object, Source extends DeepPartial<Target>>(
    target: Target,
    source?: Source,
    params: {
        path?: string;
        matcherPath?: string;
        skip?: string[];
        idx?: number;
    } & JsonApplyParams = {}
): Target {
    const {
        path = undefined,
        matcherPath = path ? path.replace(/(\[[0-9+]+])/i, '[]') : undefined,
        skip = [],
        constructors = {},
        constructedArrays = new WeakMap(),
        allowedTypes = {},
        idx,
    } = params;

    if (target == null) {
        throw new Error(`AG Charts - target is uninitialised: ${path ?? '<root>'}`);
    }
    if (source == null) {
        return target;
    }

    const targetAny = target as any;
    if (idx != null && '_declarationOrder' in targetAny) {
        targetAny['_declarationOrder'] = idx;
    }

    const targetType = classify(target);
    for (const property in source) {
        const propertyMatcherPath = `${matcherPath ? matcherPath + '.' : ''}${property}`;
        if (skip.indexOf(propertyMatcherPath) >= 0) {
            continue;
        }

        const newValue = source[property];
        const propertyPath = `${path ? path + '.' : ''}${property}`;
        const targetClass = targetAny.constructor;
        const currentValue = targetAny[property];
        let ctr = constructors[propertyMatcherPath] ?? constructors[property];
        try {
            const currentValueType = classify(currentValue);
            const newValueType = classify(newValue);

            if (
                targetType === CLASS_INSTANCE_TYPE &&
                !(property in target || Object.prototype.hasOwnProperty.call(targetAny, property))
            ) {
                Logger.warn(`unable to set [${propertyPath}] in ${targetClass?.name} - property is unknown`);
                continue;
            }

            const allowableTypes = allowedTypes[propertyMatcherPath] ?? [currentValueType];
            if (currentValueType === CLASS_INSTANCE_TYPE && newValueType === 'object') {
                // Allowed, this is the common case! - do not error.
            } else if (currentValueType != null && newValueType != null && !allowableTypes.includes(newValueType)) {
                Logger.warn(
                    `unable to set [${propertyPath}] in ${targetClass?.name} - can't apply type of [${newValueType}], allowed types are: [${allowableTypes}]`
                );
                continue;
            }

            if (newValueType === 'array') {
                ctr = ctr ?? constructedArrays.get(currentValue) ?? constructors[`${propertyMatcherPath}[]`];
                if (ctr != null) {
                    const newValueArray: any[] = newValue as any;
                    targetAny[property] = newValueArray.map((v, idx) =>
                        jsonApply(new ctr(), v, {
                            ...params,
                            path: propertyPath,
                            matcherPath: propertyMatcherPath + '[]',
                            idx,
                        })
                    );
                } else {
                    targetAny[property] = newValue;
                }
            } else if (newValueType === CLASS_INSTANCE_TYPE) {
                targetAny[property] = newValue;
            } else if (newValueType === 'object') {
                if (currentValue != null) {
                    jsonApply(currentValue, newValue as any, {
                        ...params,
                        path: propertyPath,
                        matcherPath: propertyMatcherPath,
                        idx: undefined,
                    });
                } else if (ctr != null) {
                    targetAny[property] = jsonApply(new ctr(), newValue as any, {
                        ...params,
                        path: propertyPath,
                        matcherPath: propertyMatcherPath,
                        idx: undefined,
                    });
                } else {
                    targetAny[property] = newValue;
                }
            } else {
                targetAny[property] = newValue;
            }
        } catch (error: any) {
            Logger.warn(`unable to set [${propertyPath}] in [${targetClass?.name}]; nested error is: ${error.message}`);
        }
    }

    return target;
}

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
export function jsonWalk(
    json: any,
    visit: (classification: RestrictedClassification, node: any, ...otherNodes: any[]) => void,
    opts?: { skip?: string[] },
    ...jsons: any[]
) {
    const jsonType = classify(json);
    const { skip = [] } = opts ?? {};

    if (jsonType === 'array') {
        visit(jsonType, json, ...jsons);
        json.forEach((element: any, index: number) => {
            jsonWalk(element, visit, opts, ...(jsons ?? []).map((o) => o?.[index]));
        });
        return;
    }
    if (jsonType !== 'object') {
        return;
    }

    visit(jsonType, json, ...jsons);
    for (const property in json) {
        if (skip.includes(property)) {
            continue;
        }

        const value = json[property];
        const otherValues = jsons?.map((o) => o?.[property]);
        const valueType = classify(value);

        if (valueType === 'object' || valueType === 'array') {
            jsonWalk(value, visit, opts, ...otherValues);
        }
    }
}

const isBrowser = typeof window !== 'undefined';

type Classification = RestrictedClassification | 'function' | 'class-instance';
type RestrictedClassification = 'array' | 'object' | 'primitive';
/**
 * Classify the type of value to assist with handling for merge purposes.
 */
function classify(value: any): Classification | null {
    if (value == null) {
        return null;
    }
    if (isBrowser && value instanceof HTMLElement) {
        return 'primitive';
    }
    if (Array.isArray(value)) {
        return 'array';
    }
    if (value instanceof Date) {
        return 'primitive';
    }
    if (typeof value === 'object' && value.constructor === Object) {
        return 'object';
    }
    if (typeof value === 'function') {
        return 'function';
    }
    if (typeof value === 'object' && value.constructor != null) {
        return CLASS_INSTANCE_TYPE;
    }
    return 'primitive';
}
