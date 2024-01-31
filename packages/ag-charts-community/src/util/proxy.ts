import { addObserverToInstanceProperty, addTransformToInstanceProperty } from './decorator';
import { getPath, setPath } from './object';
import { isArray } from './type-guards';

export function ProxyProperty(proxyPath: string | string[]) {
    const pathArray = isArray(proxyPath) ? proxyPath : proxyPath.split('.');

    if (pathArray.length === 1) {
        const [property] = pathArray;
        return addTransformToInstanceProperty(
            (target, _, value) => (target[property] = value),
            (target) => target[property]
        );
    }

    return addTransformToInstanceProperty(
        (target, _, value) => setPath(target, pathArray, value),
        (target) => getPath(target, pathArray)
    );
}

export function ProxyOnWrite(proxyProperty: string) {
    return addTransformToInstanceProperty((target, _, value) => (target[proxyProperty] = value));
}

export function ProxyPropertyOnWrite(childName: string, childProperty?: string) {
    return addTransformToInstanceProperty((target, key, value) => (target[childName][childProperty ?? key] = value));
}

export interface ActionOnSetOptions<T> {
    newValue?: (this: T, newValue: any) => void;
    oldValue?: (this: T, oldValue: any) => void;
    changeValue?: (this: T, newValue?: any, oldValue?: any) => void;
}

/**
 * Allows side-effects to be triggered on property write.
 *
 * @param opts.newValue called when a new value is set - never called for undefined values.
 * @param opts.oldValue called with the old value before a new value is set - never called for
 *                      undefined values.
 * @param opts.changeValue called on any change to the value - always called.
 */
export function ActionOnSet<T>(opts: ActionOnSetOptions<T>) {
    const { newValue: newValueFn, oldValue: oldValueFn, changeValue: changeValueFn } = opts;
    return addTransformToInstanceProperty((target, _, newValue, oldValue) => {
        if (newValue !== oldValue) {
            if (oldValue !== undefined) {
                oldValueFn?.call(target, oldValue);
            }
            if (newValue !== undefined) {
                newValueFn?.call(target, newValue);
            }
            changeValueFn?.call(target, newValue, oldValue);
        }

        return newValue;
    });
}

export function ObserveChanges<T>(observerFn: (target: T, newValue?: any, oldValue?: any) => void) {
    return addObserverToInstanceProperty(observerFn);
}
