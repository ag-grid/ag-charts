export const Invalidating: PropertyDecorator = (target: any, propertyKey) => {
    const mappedProperty = Symbol(String(propertyKey));

    target[mappedProperty] = undefined;

    Object.defineProperty(target, propertyKey, {
        get() {
            return this[mappedProperty];
        },
        set(newValue) {
            const oldValue = this[mappedProperty];
            if (oldValue !== newValue) {
                this[mappedProperty] = newValue;
                this.invalid = true;
            }
        },
        enumerable: true,
        configurable: false,
    });
};
