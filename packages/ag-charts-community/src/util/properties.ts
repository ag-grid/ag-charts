import { ChangeDetectable } from '../scene/changeDetectable';
import { extractDecoratedPropertyMetadata, listDecoratedProperties } from './decorator';

export class BaseProperties<T extends object = object> extends ChangeDetectable {
    constructor(properties?: T) {
        super();
        if (properties) {
            this.set(properties);
        }
    }

    set(properties: T) {
        for (const propertyKey of listDecoratedProperties(this)) {
            if (Object.hasOwn(properties, propertyKey)) {
                const value = properties[propertyKey as keyof T];
                const self = this as any;
                if (isProperties(self[propertyKey])) {
                    self[propertyKey].set(value);
                } else {
                    self[propertyKey] = value;
                }
            }
        }
    }

    isValid<TContext = Omit<T, 'type'>>(this: TContext) {
        return listDecoratedProperties(this).every((propertyKey) => {
            const { optional } = extractDecoratedPropertyMetadata(this, propertyKey)!;
            return optional || typeof this[propertyKey as keyof TContext] !== 'undefined';
        });
    }
}

export function isProperties<T extends object>(value: unknown): value is BaseProperties<T> {
    return value instanceof BaseProperties;
}
