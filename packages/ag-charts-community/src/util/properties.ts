import { Logger, isArray, isPlainObject } from 'ag-charts-core';

import { addFakeTransformToInstanceProperty, listDecoratedProperties } from './decorator';
import { merge } from './object';

export const Property = addFakeTransformToInstanceProperty;

export class BaseProperties<T extends object = object> {
    handleUnknownProperties(_unknownKeys: Set<string>, _properties: T) {
        // override point for derived class.
    }

    set(properties: T) {
        const { className = this.constructor.name } = this.constructor as { className?: string };

        if (typeof properties !== 'object') {
            Logger.warn(`unable to set ${className} - expecting a properties object`);
            return this;
        }

        const keys = new Set(Object.keys(properties));
        for (const propertyKey of listDecoratedProperties(this)) {
            if (keys.has(propertyKey)) {
                const value = properties[propertyKey as keyof T];
                const self = this as any;
                if (isProperties(self[propertyKey])) {
                    // re-set property to force re-validation
                    if (self[propertyKey] instanceof PropertiesArray) {
                        const array = self[propertyKey].reset(value);
                        if (array != null) {
                            self[propertyKey] = array;
                        } else {
                            Logger.warn(`unable to set [${propertyKey}] - expecting a properties array`);
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
            Logger.warn(`unable to set [${unknownKey}] in ${className} - property is unknown`);
        }

        return this;
    }

    toJson<J>(this: J): T {
        return listDecoratedProperties(this).reduce<Record<string, any>>((object, propertyKey) => {
            const propertyValue = this[propertyKey as keyof J];
            object[propertyKey] = isProperties(propertyValue) ? propertyValue.toJson() : propertyValue;
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
