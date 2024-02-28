export const BREAK_TRANSFORM_CHAIN = Symbol('BREAK');

const CONFIG_KEY = '__decorator_config';

type TransformFn = (
    target: any,
    key: string | symbol,
    value: any,
    oldValue?: any
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
) => any | typeof BREAK_TRANSFORM_CHAIN;

type ObserveFn = (target: any, value: any, oldValue?: any) => void;

interface TransformConfig {
    setters: TransformFn[];
    getters: TransformFn[];
    observers: ObserveFn[];
    valuesMap: WeakMap<object, Map<string, unknown>>;
    optional?: boolean;
}

type ConfigMetadata = Omit<TransformConfig, 'setters' | 'getters' | 'observers' | 'valuesMap'>;

type DecoratedObject = { __decorator_config: Record<string, TransformConfig> };

function initialiseConfig(target: any, propertyKeyOrSymbol: string | symbol) {
    if (Object.getOwnPropertyDescriptor(target, CONFIG_KEY) == null) {
        Object.defineProperty(target, CONFIG_KEY, { value: {} });
    }

    const config: Record<string, TransformConfig> = target[CONFIG_KEY];
    const propertyKey = propertyKeyOrSymbol.toString();

    if (typeof config[propertyKey] !== 'undefined') {
        return config[propertyKey];
    }

    const valuesMap = new WeakMap();
    config[propertyKey] = { setters: [], getters: [], observers: [], valuesMap };

    const descriptor = Object.getOwnPropertyDescriptor(target, propertyKeyOrSymbol);
    const prevSet = descriptor?.set;
    const prevGet = descriptor?.get;

    const getter = function (this: any) {
        let value = prevGet ? prevGet.call(this) : valuesMap.get(this);
        for (const transformFn of config[propertyKey].getters) {
            value = transformFn(this, propertyKeyOrSymbol, value);

            if (value === BREAK_TRANSFORM_CHAIN) {
                return;
            }
        }

        return value;
    };
    const setter = function (this: any, value: unknown) {
        const { setters, observers } = config[propertyKey];

        let oldValue;
        if (setters.some((f) => f.length > 2)) {
            // Lazily retrieve old value.
            oldValue = prevGet ? prevGet.call(this) : valuesMap.get(this);
        }

        for (const transformFn of setters) {
            value = transformFn(this, propertyKeyOrSymbol, value, oldValue);

            if (value === BREAK_TRANSFORM_CHAIN) {
                return;
            }
        }

        if (prevSet) {
            prevSet.call(this, value);
        } else {
            valuesMap.set(this, value);
        }

        for (const observerFn of observers) {
            observerFn(this, value, oldValue);
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
    return typeof target !== 'undefined' && CONFIG_KEY in target;
}

export function listDecoratedProperties(target: any): string[] {
    const targets = new Set<object>();
    while (isDecoratedObject(target)) {
        targets.add(target?.[CONFIG_KEY]);
        target = Object.getPrototypeOf(target);
    }
    return Array.from(targets).flatMap((configMap) => Object.keys(configMap));
}

export function extractDecoratedProperties(target: any) {
    return listDecoratedProperties(target).reduce<Record<string, any>>((result, key) => {
        result[key] = target[key] ?? null;
        return result;
    }, {});
}

export function extractDecoratedPropertyMetadata(target: any, propertyKeyOrSymbol: string | symbol) {
    const propertyKey = propertyKeyOrSymbol.toString();
    while (isDecoratedObject(target)) {
        const config: Record<string, TransformConfig> = target[CONFIG_KEY];
        if (Object.hasOwn(config, propertyKey)) {
            return config[propertyKey];
        }
        target = Object.getPrototypeOf(target);
    }
}
