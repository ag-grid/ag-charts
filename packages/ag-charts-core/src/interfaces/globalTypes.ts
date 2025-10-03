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

export type DeepPartial<T> =
    T extends Array<unknown> ? T : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export type PickRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type RequireOptional<T> = {
    [K in keyof Required<T>]: T[K] extends Required<T[K]> ? T[K] : T[K] | undefined;
};

export type Intersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export type IsUnion<T> = [T] extends [infer U]
    ? (U extends any ? (x: U) => any : never) extends (x: infer I) => any
        ? [T] extends [I]
            ? false
            : true
        : never
    : never;

export type IsAny<T> = 0 extends 1 & T ? true : false;

export type AreExact<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
