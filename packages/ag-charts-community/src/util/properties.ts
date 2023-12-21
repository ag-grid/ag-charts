import { ChangeDetectable } from '../scene/changeDetectable';
import { extractDecoratedPropertyMetadata, listDecoratedProperties } from './decorator';
import { isArray } from './type-guards';

export class BaseProperties<T extends object = object> extends ChangeDetectable {
    set(properties: T, reset?: boolean) {
        for (const propertyKey of listDecoratedProperties(this)) {
            if (reset || Object.hasOwn(properties, propertyKey)) {
                const value = properties[propertyKey as keyof T];
                const self = this as any;
                if (isProperties(self[propertyKey])) {
                    // re-set property to force re-validation
                    self[propertyKey] = self[propertyKey].set(value, reset);
                } else {
                    self[propertyKey] = value;
                }
            }
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

    constructor(itemFactory: new () => T, arrayLength = 0) {
        super(arrayLength);
        Object.defineProperty(this, 'itemFactory', { value: itemFactory, enumerable: false, configurable: false });
    }

    set(properties: object[]): PropertiesArray<T> {
        if (isArray(properties)) {
            const newArray = new PropertiesArray(this.itemFactory);
            newArray.push(...properties.map((property) => new this.itemFactory().set(property)));
            return newArray;
        }
        return this;
    }
}

export function isProperties<T extends object>(value: unknown): value is BaseProperties<T> {
    return value instanceof BaseProperties || value instanceof PropertiesArray;
}
