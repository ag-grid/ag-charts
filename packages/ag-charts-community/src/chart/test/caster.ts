import { expect } from '@jest/globals';

function cast<T>(thing: unknown, ctor: { new (...args: any[]): T }): T {
    expect(thing).toBeDefined();
    expect(thing).toBeInstanceOf(ctor);
    return thing as T;
}

function findProperty<T, K extends string>(thing: T, propertyName: K): Omit<T, K> & { [P in K]: unknown } {
    expect(thing).toHaveProperty(propertyName);
    return thing as T & { [P in K]: unknown };
}

function castProperty<T, V, K extends keyof T>(
    thing: T,
    propertyName: K,
    propertyCtor: { new (...args: unknown[]): V }
): Omit<T, K> & { [P in K]: V } {
    expect(thing[propertyName]).toBeDefined();
    expect(thing[propertyName]).toBeInstanceOf(propertyCtor);
    return thing as T & { [P in K]: V };
}

function castPropertyArray<T, V, K extends keyof T>(
    thing: T,
    propertyName: K,
    elementCtor: { new (...args: unknown[]): V }
): Omit<T, K> & { [P in K]: V[] } {
    for (const elem of castProperty(thing, propertyName, Array)[propertyName]) {
        expect(elem).toBeInstanceOf(elementCtor);
    }
    return thing as T & { [P in K]: V[] };
}

export class Caster<T> {
    constructor(readonly value: T) {}

    cast<NewT>(ctor: { new (...args: any[]): NewT }): Caster<NewT> {
        return new Caster(cast(this.value, ctor));
    }
    findProperty<K extends string>(propertyName: K): Caster<Omit<T, K> & { [P in K]: unknown }> {
        return new Caster(findProperty(this.value, propertyName));
    }
    castProperty<V, K extends keyof T>(
        propertyName: K,
        propertyCtor: { new (...args: any[]): V }
    ): Caster<Omit<T, K> & { [P in K]: V }> {
        return new Caster(castProperty(this.value, propertyName, propertyCtor));
    }
    castPropertyArray<V, K extends keyof T>(
        propertyName: K,
        elementCtor: { new (...args: any[]): V }
    ): Caster<Omit<T, K> & { [P in K]: V[] }> {
        return new Caster(castPropertyArray(this.value, propertyName, elementCtor));
    }
    accessProperty<K extends string>(propertyName: K): Caster<unknown> {
        return new Caster(findProperty(this.value, propertyName)[propertyName]);
    }
}
