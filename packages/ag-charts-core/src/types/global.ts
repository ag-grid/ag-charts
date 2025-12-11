export type AnyFn = (...args: any[]) => any;

export type Callback = (params: any) => any;

export type CallbackParam<F extends Callback> = Parameters<F>[0];

export type Nullable<T> = T | null | undefined;

export type PlainObject = { [key: string | number | symbol]: any };

export type Has<P extends keyof T, T> = T & { [K in P]-?: T[P] };

export type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;

export type Defined<T> = T extends undefined ? never : T;

export type DeepRequired<T, IgnoredKeys extends string = never> = T extends AnyFn
    ? T
    : T extends any[]
      ? _DeepRequiredArray<T[number], IgnoredKeys>
      : T extends object
        ? _DeepRequiredObject<T, IgnoredKeys>
        : T;

type _DeepRequiredArray<T, IgnoredKeys extends string> = Array<DeepRequired<Defined<T>, IgnoredKeys>>;

type _DeepRequiredObject<T, IgnoredKeys extends string> = {
    [K in keyof T]-?: K extends IgnoredKeys
        ? NonNullable<T[K]> // skip recursion, just remove undefined
        : DeepRequired<Defined<T[K]>, IgnoredKeys>;
};

export type DeepReadonly<T> = T extends (...args: any[]) => any
    ? T
    : T extends any[]
      ? _DeepReadonlyArray<T[number]>
      : T extends object
        ? _DeepReadonlyObject<T>
        : T;

type _DeepReadonlyArray<T> = ReadonlyArray<DeepReadonly<T>>;

type _DeepReadonlyObject<T> = {
    readonly [K in keyof T]: DeepReadonly<T[K]>;
};

export type DeepPartial<T> =
    T extends Array<unknown> ? T : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export type PickRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type RequireOptional<T> = {
    [K in keyof Required<T>]: T[K] extends Required<T[K]> ? T[K] : T[K] | undefined;
};

export type Intersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export type StripCallSignature<T> = { [K in keyof T]: T[K] };

export type IsUnion<T> = [T] extends [infer U]
    ? (U extends any ? (x: U) => any : never) extends (x: infer I) => any
        ? [T] extends [I]
            ? false
            : true
        : never
    : never;

export type IsAny<T> = 0 extends 1 & T ? true : false;

export type AreExact<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export type ConstructorReturnType<T extends abstract new (...args: any) => any> = T extends abstract new (
    ...args: any
) => infer P
    ? P
    : never;

type NN<T> = NonNullable<T>;
/**
 * Helper macro for nested NonNullable key accessors.
 *
 * The maximum depth is capped at 8. This is intentional to keep the implementation simple. A dyanmic & recusive
 * implementation is possible and would remove this limitation, however the recursive nature would require memory of
 * exponential complexity (which is impractical, and will choke the TypeScript compiler).
 *
 * @example
 * NonNullablePath< T, 'a', 'b', 'c' >
 * // expands to...
 * NonNullable<NonNullable<NonNullable<T>['a']>['b']>['b']>
 *
 * @summary Nested NonNullable getters
 */
export type NonNullablePath<
    T,
    K0 extends keyof T = never,
    K1 extends keyof NN<T[K0]> = never,
    K2 extends keyof NN<NN<T[K0]>[K1]> = never,
    K3 extends keyof NN<NN<NN<T[K0]>[K1]>[K2]> = never,
    K4 extends keyof NN<NN<NN<NN<T[K0]>[K1]>[K2]>[K3]> = never,
    K5 extends keyof NN<NN<NN<NN<NN<T[K0]>[K1]>[K2]>[K3]>[K4]> = never,
    K6 extends keyof NN<NN<NN<NN<NN<NN<T[K0]>[K1]>[K2]>[K3]>[K4]>[K5]> = never,
    K7 extends keyof NN<NN<NN<NN<NN<NN<NN<T[K0]>[K1]>[K2]>[K3]>[K4]>[K5]>[K6]> = never,
> = [K0] extends [never]
    ? T
    : [K1] extends [never]
      ? NN<T[K0]>
      : [K2] extends [never]
        ? NN<NN<T[K0]>[K1]>
        : [K3] extends [never]
          ? NN<NN<NN<T[K0]>[K1]>[K2]>
          : [K4] extends [never]
            ? NN<NN<NN<NN<T[K0]>[K1]>[K2]>[K3]>
            : [K5] extends [never]
              ? NN<NN<NN<NN<NN<T[K0]>[K1]>[K2]>[K3]>[K4]>
              : [K6] extends [never]
                ? NN<NN<NN<NN<NN<NN<T[K0]>[K1]>[K2]>[K3]>[K4]>[K5]>
                : [K7] extends [never]
                  ? NN<NN<NN<NN<NN<NN<NN<T[K0]>[K1]>[K2]>[K3]>[K4]>[K5]>[K6]>
                  : NN<NN<NN<NN<NN<NN<NN<NN<T[K0]>[K1]>[K2]>[K3]>[K4]>[K5]>[K6]>[K7]>;
