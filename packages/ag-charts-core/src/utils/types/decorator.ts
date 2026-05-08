export const BREAK_TRANSFORM_CHAIN = Symbol('BREAK');

const CONFIG_KEY = '__decorator_config';
const ACCESSORS_KEY = '__decorator_accessors';

type ConfigMetadata = Omit<TransformConfig, 'setters' | 'getters' | 'observers'>;
type TransformFn = (target: any, key: string | symbol, value: any, oldValue?: any) => any;
type ObserveFn = (target: any, value: any, oldValue?: any) => void;

interface TransformConfig {
    setters: TransformFn[];
    getters: TransformFn[];
    observers: ObserveFn[];
    optional?: boolean;
}

interface DecoratedObject {
    [CONFIG_KEY]: Record<string, TransformConfig>;
}

// Used temporarily while transitioning between options validation methods.
export function addFakeTransformToInstanceProperty(target: any, propertyKeyOrSymbol: string | symbol) {
    initialiseConfig(target, propertyKeyOrSymbol).optional = true;
}

function initialiseConfig(target: any, propertyKeyOrSymbol: string | symbol) {
    if (Object.getOwnPropertyDescriptor(target, CONFIG_KEY) == null) {
        Object.defineProperty(target, CONFIG_KEY, { value: {} });
    }
    if (Object.getOwnPropertyDescriptor(target, ACCESSORS_KEY) == null) {
        const parentAccessors: (string | symbol)[] | undefined = Object.getPrototypeOf(target)?.[ACCESSORS_KEY];
        const accessors = parentAccessors?.slice() ?? [];
        Object.defineProperty(target, ACCESSORS_KEY, { value: accessors });
    }

    const config: Record<string, TransformConfig> = target[CONFIG_KEY];
    const propertyKey = propertyKeyOrSymbol.toString();

    if (config[propertyKey] != null) {
        return config[propertyKey];
    }

    config[propertyKey] = { setters: [], getters: [], observers: [] };

    const descriptor = Object.getOwnPropertyDescriptor(target, propertyKeyOrSymbol);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    let prevGet = descriptor?.get;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    let prevSet = descriptor?.set;

    if (prevGet == null || prevSet == null) {
        const accessors: any[] = target[ACCESSORS_KEY];
        let index = accessors.indexOf(propertyKeyOrSymbol);
        if (index === -1) {
            index = accessors.push(propertyKeyOrSymbol) - 1;
        }

        prevGet ??= function (this: any): any {
            let accessorValues = this.__accessors;
            if (accessorValues == null) {
                accessorValues = accessors.slice().fill(undefined);
                Object.defineProperty(this, '__accessors', { value: accessorValues });
            }
            return accessorValues[index];
        };
        prevSet ??= function (this: any, value: any) {
            let accessorValues = this.__accessors;
            if (accessorValues == null) {
                accessorValues = accessors.slice().fill(undefined);
                Object.defineProperty(this, '__accessors', { value: accessorValues });
            }
            accessorValues[index] = value;
        };
    }

    // Cache the per-property config object so the property-key string lookup happens
    // once at decoration time, not on every getter/setter call. The arrays inside the
    // config are mutated by addTransformToInstanceProperty/addObserverToInstanceProperty
    // but the object identity is stable.
    const propertyConfig = config[propertyKey];

    const getter = function (this: any) {
        const baseValue = prevGet.call(this);
        // Fast path: most decorated properties have no get-transform configured.
        const getters = propertyConfig.getters;
        if (getters.length === 0) {
            return baseValue;
        }
        let value = baseValue;
        for (let i = 0, n = getters.length; i < n; i++) {
            value = getters[i](this, propertyKeyOrSymbol, value);
            if (value === BREAK_TRANSFORM_CHAIN) {
                return;
            }
        }
        return value;
    };
    const setter = function (this: any, value: unknown) {
        const setters = propertyConfig.setters;
        const observers = propertyConfig.observers;

        // Lazily retrieve old value only if any setter actually consumes it
        // (`setTransform` arity > 2 means the function declared an `oldValue` param).
        let oldValue;
        for (let i = 0, n = setters.length; i < n; i++) {
            if (setters[i].length > 2) {
                oldValue = prevGet.call(this);
                break;
            }
        }

        for (let i = 0, n = setters.length; i < n; i++) {
            value = setters[i](this, propertyKeyOrSymbol, value, oldValue);
            if (value === BREAK_TRANSFORM_CHAIN) {
                return;
            }
        }

        prevSet.call(this, value);

        for (let i = 0, n = observers.length; i < n; i++) {
            observers[i](this, value, oldValue);
        }
    };

    Object.defineProperty(target, propertyKeyOrSymbol, {
        set: setter,
        get: getter,
        enumerable: true,
        configurable: false,
    });

    return config[propertyKey];
}

export function addTransformToInstanceProperty(
    setTransform: TransformFn,
    getTransform?: TransformFn,
    configMetadata?: ConfigMetadata
): PropertyDecorator {
    return (target: any, propertyKeyOrSymbol: string | symbol) => {
        const config = initialiseConfig(target, propertyKeyOrSymbol);
        config.setters.push(setTransform);
        if (getTransform) {
            config.getters.unshift(getTransform);
        }
        if (configMetadata) {
            Object.assign(config, configMetadata);
        }
    };
}

export function addObserverToInstanceProperty(setObserver: TransformFn): PropertyDecorator {
    return (target: any, propertyKeyOrSymbol: string | symbol) => {
        initialiseConfig(target, propertyKeyOrSymbol).observers.push(setObserver);
    };
}

export function isDecoratedObject(target: any): target is DecoratedObject {
    return target !== undefined && CONFIG_KEY in target;
}

export function listDecoratedProperties<T>(target: T): (keyof T)[] {
    const targets = new Set<object>();
    while (isDecoratedObject(target)) {
        targets.add(target?.[CONFIG_KEY]);
        target = Object.getPrototypeOf(target);
    }
    return Array.from(targets).flatMap((configMap) => Object.keys(configMap) as (keyof T)[]);
}

export function extractDecoratedProperties(target: any) {
    return listDecoratedProperties(target).reduce<Record<string, any>>((result, key) => {
        result[String(key)] = target[key] ?? null;
        return result;
    }, {});
}
