import { expect } from '@jest/globals';

/**
 * Pick all properties from T that are of Array type
 * Example:
 *
 *   T = {
 *     name: string,
 *     emails: { domain: string, username: string }[],
 *     data: { purchaseId: number }[]
 *   }
 *   ArraysPropertiesOf<T> = {
 *     emails: { domain: string, username: string }[],
 *     data: { purchaseId: number }[]
 *  }
 */
type ArraysPropertiesOf<T> = { [K in keyof T as T[K] extends Array<unknown> ? K : never]: T[K] };

/**
 * Pick all types of all properties of Array type.
 * Example:
 *
 *   T = {
 *     name: string,
 *     emails: { domain: string, username: string }[],
 *     data: { purchaseId: number }[]
 *   }
 *   UnionOfArrayPropertiesOf<T> =
 *     { domain: string, username: string }[] | { purchaseId: number }[]
 */
type UnionOfArrayPropertiesOf<T> = T[keyof ArraysPropertiesOf<T>];

/**
 * Pick all element types of all properties of Array type.
 * Example:
 *
 *   T = {
 *     name: string,
 *     emails: { domain: string, username: string }[],
 *     data: { purchaseId: number }[]
 *   }
 *   UnionOfArrayPropertiesOf<T> =
 *     { domain: string, username: string } | { purchaseId: number }
 */
type ElementsOfArrayPropertiesOf<T> =
    UnionOfArrayPropertiesOf<T> extends Array<unknown> ? UnionOfArrayPropertiesOf<T>[number] : never;

/**
 * Pick all keys that element types share in common.
 * Example:
 *
 *   T = {
 *     name: string,
 *     emails: { username: string, domain: string, date: Date }[],
 *     data: { purchaseId: number, domain: string, date: Date }[]
 *   }
 *   KeysOfUnionOfArrayPropertiesOf<T> = "domain" | "date"
 */
type KeysOfUnionOfArrayPropertiesOf<T> = keyof ElementsOfArrayPropertiesOf<T>;

type UnknownConstructor<T> = new (...args: unknown[]) => T;

function convert<NewT>(caster: Caster<unknown>): Caster<NewT> {
    return caster as Caster<NewT>;
}

/**
 * This class converts an input value type into new types. There no compile-time
 * checks (uses `as` internally), but the method with check the types at runtime
 * (using the `expect()` jest function).
 *
 * This is similar to a Java cast or C++ dynamic_cast.
 */
export class Caster<T> {
    constructor(readonly value: T) {}

    cast<NewT>(ctor: UnknownConstructor<NewT>): Caster<NewT> {
        expect(this.value).toBeDefined();
        expect(this.value).toBeInstanceOf(ctor);
        return convert<NewT>(this);
    }

    findProperty<K extends string>(propertyName: K) {
        type NewT = Omit<T, K> & { [P in K]: unknown };
        expect(this.value).toHaveProperty(propertyName);
        return convert<NewT>(this);
    }

    findBoolean<K extends string>(propertyName: K) {
        type NewT = Omit<T, K> & { [P in K]: boolean };
        const property: unknown = this.findProperty(propertyName).value[propertyName];
        expect(typeof property).toBe('boolean');
        return convert<NewT>(this);
    }

    findArrayElementProperties<K extends keyof ArraysPropertiesOf<T>, L extends string>(
        arrayName: K,
        elementPropertyName: L
    ) {
        type NewT = Omit<T, K> & { [Pk in K]: ArraysPropertiesOf<T>[K] & { [Pl in L]: unknown }[] };
        for (const elem of this.value[arrayName] as unknown[]) {
            expect(elem).toHaveProperty(elementPropertyName);
        }
        return convert<NewT>(this);
    }

    castProperty<V, K extends keyof T>(propertyName: K, propertyCtor: UnknownConstructor<V>) {
        type NewT = Omit<T, K> & { [P in K]: V };
        expect(this.value[propertyName]).toBeDefined();
        expect(this.value[propertyName]).toBeInstanceOf(propertyCtor);
        return convert<NewT>(this);
    }

    castPropertyArray<V, K extends keyof T>(
        propertyName: K,
        elementCtor: UnknownConstructor<V>
    ): Caster<Omit<T, K> & { [P in K]: V[] }> {
        type NewT = Omit<T, K> & { [P in K]: V[] };
        for (const elem of this.castProperty(propertyName, Array).value[propertyName]) {
            expect(elem).toBeInstanceOf(elementCtor);
        }
        return convert<NewT>(this);
    }

    castArrayElementProperties<
        V,
        K extends string & keyof ArraysPropertiesOf<T>,
        L extends string & KeysOfUnionOfArrayPropertiesOf<T>,
    >(arrayName: K, elementPropertyName: L, elementPropertyCtor: UnknownConstructor<V>) {
        type NewT = Omit<T, K> & { [Pk in K]: ArraysPropertiesOf<T>[K] & { [Pl in L]: V }[] };
        expect(this.value[arrayName]).toBeInstanceOf(Array);
        for (const unknownElem of this.value[arrayName] as unknown[]) {
            expect(unknownElem).toHaveProperty(elementPropertyName);
            const elem = unknownElem as typeof unknownElem & { [Pl in L]: unknown };
            expect(elem[elementPropertyName]).toBeInstanceOf(elementPropertyCtor);
        }
        return convert<NewT>(this);
    }

    accessProperty<K extends string>(propertyName: K): Caster<unknown> {
        const property = this.findProperty(propertyName).value[propertyName];
        return new Caster(property);
    }
}
