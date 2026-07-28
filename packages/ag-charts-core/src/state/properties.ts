import * as ambientLog from '../logging/logger';
import { merge } from '../utils/data/object';
import { listDecoratedProperties } from '../utils/types/decorator';
import { isArray, isPlainObject } from '../utils/types/typeGuards';

export { addFakeTransformToInstanceProperty as Property } from '../utils/types/decorator';

export class BaseProperties<T extends object = object> {
    handleUnknownProperties(_unknownKeys: Set<unknown>, _properties: T) {
        // override point for derived class.
    }

    set(properties: T) {
        type J = typeof this;
        const { className = this.constructor.name } = this.constructor as { className?: string };

        if (properties == null) {
            this.clear();
            return this;
        }

        if (typeof properties !== 'object') {
            ambientLog.warn(`unable to set ${className} - expecting a properties object`);
            return this;
        }

        const keys = new Set(Object.keys(properties)) as Set<keyof J>;
        for (const propertyKey of listDecoratedProperties(this)) {
            if (keys.has(propertyKey)) {
                const value: unknown = properties[propertyKey as keyof T];
                const self = this as any;
                if (isProperties(self[propertyKey])) {
                    // re-set property to force re-validation
                    if (self[propertyKey] instanceof PropertiesArray) {
                        // reset() runtime-validates the value and returns undefined for non-arrays.
                        const array = self[propertyKey].reset(value as object[]);
                        if (array == null) {
                            ambientLog.warn(`unable to set [${String(propertyKey)}] - expecting a properties array`);
                        } else {
                            self[propertyKey] = array;
                        }
                    } else {
                        // set() runtime-validates the value and warns for non-objects.
                        self[propertyKey].set(value as object);
                    }
                } else if (isPlainObject(value)) {
                    self[propertyKey] = merge(value, self[propertyKey] ?? {});
                } else {
                    self[propertyKey] = value;
                }
                keys.delete(propertyKey);
            }
        }
        this.handleUnknownProperties(keys, properties);
        for (const unknownKey of keys) {
            ambientLog.warn(`unable to set [${String(unknownKey)}] in ${className} - property is unknown`);
        }

        return this;
    }

    clear() {
        for (const propertyKey of listDecoratedProperties(this)) {
            const currentValue = this[propertyKey];
            if (isProperties(currentValue)) {
                currentValue.clear();
            } else {
                this[propertyKey] = undefined!;
            }
        }
        return this;
    }

    toJson<J>(this: J): T {
        return listDecoratedProperties(this).reduce<Record<string, any>>((object, propertyKey) => {
            const propertyValue = this[propertyKey];
            object[String(propertyKey)] = isProperties(propertyValue) ? propertyValue.toJson() : propertyValue;
            return object;
        }, {}) as T;
    }
}

export class PropertiesArray<T extends BaseProperties> extends Array<T> {
    private readonly itemFactory!: (params: any) => T;

    constructor(itemFactory: (new () => T) | ((params: any) => T), ...properties: object[]) {
        super(properties.length);
        const isConstructor = (value: Function): value is new () => T => Boolean(value?.prototype?.constructor?.name);
        const value = isConstructor(itemFactory) ? (params: any) => new itemFactory().set(params) : itemFactory;
        Object.defineProperty(this, 'itemFactory', { value, enumerable: false, configurable: false });
        this.set(properties);
    }

    set(properties: object[]): this {
        if (isArray(properties)) {
            this.length = properties.length;
            for (let i = 0; i < properties.length; i++) {
                this[i] = this.itemFactory(properties[i]);
            }
        }
        return this;
    }

    reset(properties: object[]): PropertiesArray<T> | undefined {
        if (Array.isArray(properties)) {
            return new PropertiesArray(this.itemFactory, ...properties);
        }
    }

    // Matches BaseProperties.clear() — BaseProperties.clear() recurses into any field where
    // isProperties(value) is true, which includes PropertiesArray. Without this, clearing a
    // parent (e.g. ColorScaleProperties) throws TypeError when a child array-typed property
    // is reached.
    clear(): this {
        this.length = 0;
        return this;
    }

    toJson() {
        return this.map((value) => value?.toJson?.() ?? value);
    }
}

export function isProperties<T extends object>(value: unknown): value is BaseProperties<T> {
    return value instanceof BaseProperties || value instanceof PropertiesArray;
}
