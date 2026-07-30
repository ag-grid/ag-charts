export class StateTracker<T, K = string> extends Map<K, T> {
    protected cachedState?: K;
    protected cachedValue?: T;
    private locked?: { key: K; value: T };

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

    /**
     * Pins `value` as the reported state until {@link unlock}, so a caller owning an ongoing
     * interaction is not overridden by others. Their updates are still recorded, so releasing the
     * lock resumes whichever state is current by then.
     */
    lock(key: K, value: T) {
        this.locked = { key, value };
        delete this.cachedState;
        delete this.cachedValue;
    }

    /** Releases a lock; a no-op unless `key` is the lock holder, so one owner cannot release another's. */
    unlock(key: K) {
        if (this.locked?.key !== key) return;
        this.locked = undefined;
        delete this.cachedState;
        delete this.cachedValue;
    }

    isLocked() {
        return this.locked !== undefined;
    }

    stateId(): K | undefined {
        if (this.locked) return this.locked.key;
        this.cachedState ??= Array.from(this.keys()).pop() ?? this.defaultState;
        return this.cachedState;
    }

    stateValue(): T | undefined {
        if (this.locked) return this.locked.value;
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
