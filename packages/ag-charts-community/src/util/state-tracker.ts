export class StateTracker<T, K = string> extends Map<K, T> {
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
        return this;
    }

    stateId() {
        return Array.from(this.keys()).pop() ?? this.defaultState;
    }

    stateValue() {
        return Array.from(this.values()).pop() ?? this.defaultValue;
    }
}
