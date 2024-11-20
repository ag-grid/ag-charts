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

function cast<T>(thing: unknown, ctor: UnknownConstructor<T>): T {
    expect(thing).toBeDefined();
    expect(thing).toBeInstanceOf(ctor);
    return thing as T;
}

function findProperty<T, K extends string>(thing: T, propertyName: K): Omit<T, K> & { [P in K]: unknown } {
    expect(thing).toHaveProperty(propertyName);
    return thing as T & { [P in K]: unknown };
}

function findBoolean<T, K extends string>(thing: T, propertyName: K): Omit<T, K> & { [P in K]: boolean } {
    const property: unknown = findProperty(thing, propertyName)[propertyName];
    expect(typeof property).toBe('boolean');
    return thing as T & { [P in K]: boolean };
}

function findArrayElementProperties<T, K extends keyof ArraysPropertiesOf<T>, L extends string>(
    thing: T,
    arrayName: K,
    elementPropertyName: L
): Omit<T, K> & { [Pk in K]: ArraysPropertiesOf<T>[K] & { [Pl in L]: unknown }[] } {
    for (const elem of thing[arrayName] as unknown[]) {
        expect(elem).toHaveProperty(elementPropertyName);
    }
    return thing as ReturnType<typeof findArrayElementProperties<T, K, L>>;
}

function castProperty<T, V, K extends keyof T>(
    thing: T,
    propertyName: K,
    propertyCtor: UnknownConstructor<V>
): Omit<T, K> & { [P in K]: V } {
    expect(thing[propertyName]).toBeDefined();
    expect(thing[propertyName]).toBeInstanceOf(propertyCtor);
    return thing as T & { [P in K]: V };
}

function castPropertyArray<T, V, K extends keyof T>(
    thing: T,
    propertyName: K,
    elementCtor: UnknownConstructor<V>
): Omit<T, K> & { [P in K]: V[] } {
    for (const elem of castProperty(thing, propertyName, Array)[propertyName]) {
        expect(elem).toBeInstanceOf(elementCtor);
    }
    return thing as T & { [P in K]: V[] };
}

function castArrayElementProperties<
    T,
    V,
    K extends string & keyof ArraysPropertiesOf<T>,
    L extends string & KeysOfUnionOfArrayPropertiesOf<T>,
>(
    thing: T,
    arrayName: K,
    elementPropertyName: L,
    elementPropertyCtor: UnknownConstructor<V>
): Omit<T, K> & { [Pk in K]: ArraysPropertiesOf<T>[K] & { [Pl in L]: V }[] } {
    expect(thing[arrayName]).toBeInstanceOf(Array);
    for (const unknownElem of thing[arrayName] as unknown[]) {
        const elem = findProperty(unknownElem, elementPropertyName);
        expect(elem[elementPropertyName]).toBeInstanceOf(elementPropertyCtor);
    }
    return thing as ReturnType<typeof castArrayElementProperties<T, V, K, L>>;
}

/**
 * This class converts an input value type into new types. There no compile-time
 * checks (uses `as` internally), but the method with check the types at runtime
 * (using the `expect()` jest function).
 *
 * This is similar to a Java cast or C++ dynamic_cast.
 */
export class Caster<T> {
    // FIXME: Each method returns a new object. This could be optimised.
    constructor(readonly value: T) {}

    cast<NewT>(ctor: UnknownConstructor<NewT>): Caster<NewT> {
        return new Caster(cast(this.value, ctor));
    }

    findProperty<K extends string>(propertyName: K): Caster<Omit<T, K> & { [P in K]: unknown }> {
        return new Caster(findProperty(this.value, propertyName));
    }
    findBoolean<K extends string>(propertyName: K): Caster<Omit<T, K> & { [P in K]: boolean }> {
        return new Caster(findBoolean(this.value, propertyName));
    }
    findArrayElementProperties<K extends keyof ArraysPropertiesOf<T>, L extends string>(
        arrayName: K,
        elementPropertyName: L
    ): Caster<Omit<T, K> & ReturnType<typeof findArrayElementProperties<T, K, L>>> {
        return new Caster(findArrayElementProperties(this.value, arrayName, elementPropertyName));
    }

    castProperty<V, K extends keyof T>(
        propertyName: K,
        propertyCtor: UnknownConstructor<V>
    ): Caster<Omit<T, K> & { [P in K]: V }> {
        return new Caster(castProperty(this.value, propertyName, propertyCtor));
    }
    castPropertyArray<V, K extends keyof T>(
        propertyName: K,
        elementCtor: UnknownConstructor<V>
    ): Caster<Omit<T, K> & { [P in K]: V[] }> {
        return new Caster(castPropertyArray(this.value, propertyName, elementCtor));
    }

    castArrayElementProperties<
        V,
        K extends string & keyof ArraysPropertiesOf<T>,
        L extends string & KeysOfUnionOfArrayPropertiesOf<T>,
    >(
        arrayName: K,
        elementPropertyName: L,
        elementPropertyCtor: UnknownConstructor<V>
    ): Caster<Omit<T, K> & ReturnType<typeof castArrayElementProperties<T, V, K, L>>> {
        return new Caster(castArrayElementProperties(this.value, arrayName, elementPropertyName, elementPropertyCtor));
    }

    accessProperty<K extends string>(propertyName: K): Caster<unknown> {
        return new Caster(findProperty(this.value, propertyName)[propertyName]);
    }
}
