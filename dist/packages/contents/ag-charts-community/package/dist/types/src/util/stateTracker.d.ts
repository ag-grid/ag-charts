export declare class StateTracker<T, K = string> extends Map<K, T> {
    protected readonly defaultValue?: T | undefined;
    protected readonly defaultState?: K | undefined;
    constructor(defaultValue?: T | undefined, defaultState?: K | undefined);
    set(key: K, value?: T): this;
    stateId(): K | undefined;
    stateValue(): T | undefined;
}
