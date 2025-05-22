export class StateTracker<T, K = string> extends Map<K, T> {
    private cachedState?: K;
    private cachedValue?: T;

    constructor(
        protected readonly defaultValue?: T,
        protected readonly defaultState?: K
    ) {
        super();
    }

    override set(key: K, value?: T) {
        this.delete(key); // removed even if re-set to make sure we're last
        if (typeof value !== 'undefined') {
            super.set(key, value);
        }
        delete this.cachedState;
        delete this.cachedValue;
        return this;
    }

    stateId() {
        this.cachedState ??= Array.from(this.keys()).pop() ?? this.defaultState;
        return this.cachedState;
    }

    stateValue() {
        this.cachedValue ??= Array.from(this.values()).pop() ?? this.defaultValue;
        return this.cachedValue;
    }
}
