import { extractDecoratedPropertyMetadata, listDecoratedProperties } from './decorator';
import { Logger } from './logger';
import { isArray } from './type-guards';

export class BaseProperties<T extends object = object> {
    constructor(protected className?: string) {}
    set(properties: T) {
        const keys = new Set(Object.keys(properties));
        for (const propertyKey of listDecoratedProperties(this)) {
            if (keys.has(propertyKey)) {
                const value = properties[propertyKey as keyof T];
                const self = this as any;
                if (isProperties(self[propertyKey])) {
                    // re-set property to force re-validation
                    self[propertyKey] =
                        self[propertyKey] instanceof PropertiesArray
                            ? self[propertyKey].reset(value)
                            : self[propertyKey].set(value);
                } else {
                    self[propertyKey] = value;
                }
                keys.delete(propertyKey);
            }
        }
        for (const unknownKey of keys) {
            const { className = this.constructor.name } = this.constructor as { className?: string };
            Logger.warn(`unable to set [${unknownKey}] in ${className} - property is unknown`);
        }

        return this;
    }

    isValid<TContext = Omit<T, 'type'>>(this: TContext) {
        return listDecoratedProperties(this).every((propertyKey) => {
            const { optional } = extractDecoratedPropertyMetadata(this, propertyKey)!;
            return optional || typeof this[propertyKey as keyof TContext] !== 'undefined';
        });
    }

    toJson<T>(this: T) {
        return listDecoratedProperties(this).reduce<Record<string, any>>((object, propertyKey) => {
            const propertyValue = this[propertyKey as keyof T];
            object[propertyKey] = isProperties(propertyValue) ? propertyValue.toJson() : propertyValue;
            return object;
        }, {});
    }
}

export class PropertiesArray<T extends BaseProperties> extends Array {
    private itemFactory!: new () => T;

    constructor(itemFactory: new () => T, ...properties: object[]) {
        super(properties.length);
        Object.defineProperty(this, 'itemFactory', { value: itemFactory, enumerable: false, configurable: false });
        this.set(properties);
    }

    set(properties: object[]): PropertiesArray<T> {
        if (isArray(properties)) {
            this.length = properties.length;
            for (let i = 0; i < properties.length; i++) {
                this[i] = new this.itemFactory().set(properties[i]);
            }
        }
        return this;
    }

    reset(properties: object[]): PropertiesArray<T> {
        return new PropertiesArray(this.itemFactory, ...properties);
    }

    toJson() {
        return this.slice();
    }
}

export function isProperties<T extends object>(value: unknown): value is BaseProperties<T> {
    return value instanceof BaseProperties || value instanceof PropertiesArray;
}
