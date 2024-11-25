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

function convert<NewT>(caster: Caster<unknown>): Caster<NewT> {
    return caster as Caster<NewT>;
}

/**
 * Usage: new ClassTypePair<MyClass, typeof MyClass>(MyClass)>
 *
 * Unfortunately due to the way that constructors work, the only way to write generic methods that take a constructor
 * arguments is to use `new (...args: any[]) => T` or `new (..args: unknown[]) => T`. Neither is ideal, beucase the
 * `any` approach mutes important compiler errors (causing random runtime errors), and the `unknown` approach causes
 * undesirable compilation errors because constructor arguments are not always assignable to `unknown`.
 *
 * Another approach is to use a CtorArgs generic parameter: `example<T, Args>(ctor: new (...args: Args[]) => T);`.
 * However, this doesn't always work, because with a constructor like `constructor(a: number, b: string)` the compiler
 * will complain that it is not assignable to `new (...args: (number|string)[]) => T`.
 *
 * Therefore, the generic must be the entire constructor type, but this would make the caller code very verbose but the
 * generic parameters would not be automatically derived:
 *
 *     class Example {
 *       example<T, Ctor>(ctor: Ctor): boolean;
 *     };
 *
 *     const thing = (new Example()).example<MyClass, typeof MyClass>(MyClass);
 *
 * The `MyClass` name must be typed three times for each call, which can quickly get very verbose if there are multiple
 * calls to the `example()` method. This class helps to reduce the verbosity of the caller to just:
 *
 *     const thing = (new Example()).example(CAST_INFO.MyClass)
 */
export class ClassTypePair<Type, ConstructorType> {
    constructor(
        readonly ctor: ConstructorType,
        _type?: Type
    ) {}
}

/**
 * This class converts an input value type into new types. There are no compile-time checks (uses `as` internally), but
 * the methods will check the types at runtime (using the `expect()` jest function).
 *
 * This is similar to a Java cast or C++ dynamic_cast.
 */
export class Caster<T> {
    constructor(readonly value: T) {}

    cast<NewT, Ctor>({ ctor }: ClassTypePair<NewT, Ctor>): Caster<NewT> {
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

    castProperty<V, Ctor, K extends keyof T>(propertyName: K, { ctor: propertyCtor }: ClassTypePair<V, Ctor>) {
        type NewT = Omit<T, K> & { [P in K]: V };
        expect(this.value[propertyName]).toBeDefined();
        expect(this.value[propertyName]).toBeInstanceOf(propertyCtor);
        return convert<NewT>(this);
    }

    castPropertyArray<V, Ctor, K extends keyof T>(
        propertyName: K,
        { ctor: elementCtor }: ClassTypePair<V, Ctor>
    ): Caster<Omit<T, K> & { [P in K]: V[] }> {
        type NewT = Omit<T, K> & { [P in K]: V[] };
        expect(this.value[propertyName]).toBeInstanceOf(Array);
        for (const elem of this.value[propertyName] as unknown[]) {
            expect(elem).toBeInstanceOf(elementCtor);
        }
        return convert<NewT>(this);
    }

    castArrayElementProperties<
        V,
        Ctor,
        K extends string & keyof ArraysPropertiesOf<T>,
        L extends string & KeysOfUnionOfArrayPropertiesOf<T>,
    >(arrayName: K, elementPropertyName: L, { ctor: elementPropertyCtor }: ClassTypePair<V, Ctor>) {
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
