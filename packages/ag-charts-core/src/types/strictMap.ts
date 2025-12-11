/**
 * A stricter version of `Map` where each key can have its unique value type.
 */
export interface PerKeyMap<Meta extends object> extends Map<keyof Meta, Meta[keyof Meta]> {
    set<K extends keyof Meta>(key: K, value: Meta[K]): this;
    get<K extends keyof Meta>(key: K): Meta[K] | undefined;
}
