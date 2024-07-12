import type { Intersection, PlainObject } from './types';
type FalsyType = false | null | undefined;
export declare function deepMerge<TSource extends PlainObject, TArgs extends (TSource | FalsyType)[]>(...sources: TArgs): Intersection<Exclude<TSource, FalsyType>>;
export declare function mergeDefaults<TSource extends PlainObject, TArgs extends (TSource | FalsyType)[]>(...sources: TArgs): Intersection<Exclude<TArgs[number], FalsyType>>;
export declare function mergeArrayDefaults(dataArray: PlainObject[], ...itemDefaults: PlainObject[]): PlainObject[];
export declare function mapValues<T extends PlainObject, R>(object: T, mapper: (value: T[keyof T], key: keyof T, object: T) => R): Record<keyof T, R>;
export declare function without(object: object | undefined, keys: string[]): {};
export declare function getPath(object: object, path: string | string[]): any;
export declare const SKIP_JS_BUILTINS: Set<string>;
export declare function setPath(object: object, path: string | string[], newValue: unknown): any;
export declare function partialAssign<T>(keysToCopy: (keyof T)[], target: T, source?: Partial<T>): T;
export {};
