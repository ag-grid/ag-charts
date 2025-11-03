export class StateTracker<T, K = string> extends Map<K, T> {
    protected cachedState?: K;
    protected cachedValue?: T;

    constructor(
        protected readonly defaultValue?: T,
        protected readonly defaultState?: K
    ) {
        super();
    }

    override set(key: K, value?: T) {
        this.delete(key); // removed even if re-set to make sure we're last
        if (value !== undefined) {
            super.set(key, value);
        }
        delete this.cachedState;
        delete this.cachedValue;
        return this;
    }

    override delete(key: K) {
        delete this.cachedState;
        delete this.cachedValue;
        return super.delete(key);
    }

    stateId(): K | undefined {
        this.cachedState ??= Array.from(this.keys()).pop() ?? this.defaultState;
        return this.cachedState;
    }

    stateValue(): T | undefined {
        this.cachedValue ??= Array.from(this.values()).pop() ?? this.defaultValue;
        return this.cachedValue;
    }
}

export class NonNullableStateTracker<T, K = string> extends StateTracker<T, K> {
    constructor(
        protected override readonly defaultValue: T,
        protected override readonly defaultState: K
    ) {
        super(defaultValue, defaultState);
    }

    override stateId(): K {
        return super.stateId() ?? this.defaultState;
    }

    override stateValue(): T {
        return super.stateValue() ?? this.defaultValue;
    }
}
