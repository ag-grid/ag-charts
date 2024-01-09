import { addObserverToInstanceProperty, addTransformToInstanceProperty } from './decorator';

export function ProxyProperty(...proxyProperties: string[]) {
    if (!proxyProperties.length) {
        throw new Error('ProxyProperty expects at least one proxyProperties argument.');
    }

    const property = proxyProperties.at(-1)!;

    if (proxyProperties.length === 1) {
        return addTransformToInstanceProperty(
            (target, _, value) => (target[property] = value),
            (target, _) => target[property]
        );
    }

    const getTarget = (target: any) => {
        let value = target;
        for (let i = 0; i < proxyProperties.length - 1; i++) {
            value = value[proxyProperties[i]];
        }
        return value;
    };

    return addTransformToInstanceProperty(
        (target, _, value) => (getTarget(target)[property] = value),
        (target, _) => getTarget(target)[property]
    );
}

export function ProxyOnWrite(proxyProperty: string) {
    return addTransformToInstanceProperty((target, _, value) => (target[proxyProperty] = value));
}

export function ProxyPropertyOnWrite(childName: string, childProperty?: string) {
    return addTransformToInstanceProperty((target, key, value) => (target[childName][childProperty ?? key] = value));
}

/**
 * Allows side-effects to be triggered on property write.
 *
 * @param opts.newValue called when a new value is set - never called for undefined values.
 * @param opts.oldValue called with the old value before a new value is set - never called for
 *                      undefined values.
 * @param opts.changeValue called on any change to the value - always called.
 */
export function ActionOnSet<T>(opts: {
    newValue?: (this: T, newValue: any) => void;
    oldValue?: (this: T, oldValue: any) => void;
    changeValue?: (this: T, newValue?: any, oldValue?: any) => void;
}) {
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
