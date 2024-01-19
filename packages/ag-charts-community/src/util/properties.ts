import { ChangeDetectable } from '../scene/changeDetectable';
import { extractDecoratedPropertyMetadata, listDecoratedProperties } from './decorator';
import { Logger } from './logger';
import { isArray } from './type-guards';

export class BaseProperties<T extends object = object> extends ChangeDetectable {
    constructor(protected className?: string) {
        super();
    }
    set(properties: T) {
        const keys = new Set(Object.keys(properties));
        for (const propertyKey of listDecoratedProperties(this)) {
            if (keys.has(propertyKey)) {
                const value = properties[propertyKey as keyof T];
                const self = this as any;
                if (isProperties(self[propertyKey])) {
                    // re-set property to force re-validation
                    if (isResettable(self[propertyKey])) {
                        self[propertyKey] = self[propertyKey].reset(value);
                    } else {
                        self[propertyKey] = self[propertyKey].set(value);
                    }
                } else {
                    self[propertyKey] = value;
                }
                keys.delete(propertyKey);
            }
        }
        for (const unknownKey of keys) {
            const { className = this.constructor.name } = this;
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
            object[propertyKey] = this[propertyKey as keyof T];
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
}

export class OptionalPropertiesArray<T extends BaseProperties> {
    private array: PropertiesArray<T>;
    private value: PropertiesArray<T> | undefined;

    constructor(itemFactory: new () => T) {
        this.array = new PropertiesArray(itemFactory);
        this.value = undefined;
    }

    private undefine() {
        this.array.length = 0;
        this.value = undefined;
    }

    private define(array: PropertiesArray<T>) {
        this.array = array;
        this.value = array;
    }

    getArray(): PropertiesArray<T> | undefined {
        return this.value;
    }

    set(properties: object[] | undefined): OptionalPropertiesArray<T> {
        if (properties === undefined) {
            this.undefine();
        } else {
            this.define(this.array.set(properties));
        }
        return this;
    }

    reset(properties: object[] | undefined): OptionalPropertiesArray<T> {
        if (properties === undefined) {
            this.undefine();
        } else {
            this.define(this.array.reset(properties));
        }
        return this;
    }
}

export function isProperties<T extends object>(value: unknown): value is BaseProperties<T> {
    return (
        value instanceof BaseProperties || value instanceof PropertiesArray || value instanceof OptionalPropertiesArray
    );
}

type Resettable<T extends BaseProperties> = {
    reset(properties: object[] | undefined): Resettable<T>;
};

function isResettable<T extends BaseProperties>(value: unknown): value is Resettable<T> {
    return value instanceof PropertiesArray || value instanceof OptionalPropertiesArray;
}
