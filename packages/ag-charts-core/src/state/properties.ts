import * as Logger from '../logging/logger';
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
            Logger.warn(`unable to set ${className} - expecting a properties object`);
            return this;
        }

        const keys = new Set(Object.keys(properties)) as Set<keyof J>;
        for (const propertyKey of listDecoratedProperties(this)) {
            if (keys.has(propertyKey)) {
                const value = properties[propertyKey as keyof T];
                const self = this as any;
                if (isProperties(self[propertyKey])) {
                    // re-set property to force re-validation
                    if (self[propertyKey] instanceof PropertiesArray) {
                        const array = self[propertyKey].reset(value);
                        if (array == null) {
                            Logger.warn(`unable to set [${String(propertyKey)}] - expecting a properties array`);
                        } else {
                            self[propertyKey] = array;
                        }
                    } else {
                        self[propertyKey].set(value);
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
            Logger.warn(`unable to set [${String(unknownKey)}] in ${className} - property is unknown`);
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

    toJson() {
        return this.map((value) => value?.toJson?.() ?? value);
    }
}

export function isProperties<T extends object>(value: unknown): value is BaseProperties<T> {
    return value instanceof BaseProperties || value instanceof PropertiesArray;
}
