import { extractDecoratedPropertyMetadata, listDecoratedProperties } from './decorator';
import { Logger } from './logger';
import { isArray } from './type-guards';

export class BaseProperties<T extends object = object> {
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
            Logger.warn(`unable to set [${unknownKey}] in ${className} - property is unknown`);
        }

        return this;
    }

    isValid<TContext = Omit<T, 'type'>>(this: TContext) {
        return listDecoratedProperties(this).every((propertyKey) => {
            const { optional } = extractDecoratedPropertyMetadata(this, propertyKey)!;
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            const valid = optional || typeof this[propertyKey as keyof TContext] !== 'undefined';
            if (!valid) {
                Logger.warnOnce(`[${propertyKey}] is required.`);
            }
            return valid;
        });
    }

    toJson<J>(this: J): T {
        return listDecoratedProperties(this).reduce<Record<string, any>>((object, propertyKey) => {
            const propertyValue = this[propertyKey as keyof J];
            object[propertyKey] = isProperties(propertyValue) ? propertyValue.toJson() : propertyValue;
            return object;
        }, {}) as T;
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
        return this.map((value) => value?.toJson?.() ?? value);
    }
}

export function isProperties<T extends object>(value: unknown): value is BaseProperties<T> {
    return value instanceof BaseProperties || value instanceof PropertiesArray;
}
