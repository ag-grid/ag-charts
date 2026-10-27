export class StateTracker<T, K = string> extends Map<K, T> {
    protected cachedState?: K;
    protected cachedValue?: T;
    /** Whether each cache is current, so a resolved `undefined` (an empty tracker) is cached too. */
    private stateCached = false;
    private valueCached = false;
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
        this.invalidate();
        return this;
    }

    override delete(key: K) {
        this.invalidate();
        return super.delete(key);
    }

    /**
     * Pins `value` as the reported state until {@link unlock}, so a caller owning an ongoing
     * interaction is not overridden by others. Their updates are still recorded, so releasing the
     * lock resumes whichever state is current by then.
     */
    lock(key: K, value: T) {
        this.locked = { key, value };
        this.invalidate();
    }

    /** Releases a lock; a no-op unless `key` is the lock holder, so one owner cannot release another's. */
    unlock(key: K) {
        if (this.locked?.key !== key) return;
        this.locked = undefined;
        this.invalidate();
    }

    isLocked() {
        return this.locked !== undefined;
    }

    stateId(): K | undefined {
        if (this.locked) return this.locked.key;
        if (!this.stateCached) {
            this.cachedState = Array.from(this.keys()).pop() ?? this.defaultState;
            this.stateCached = true;
        }
        return this.cachedState;
    }

    stateValue(): T | undefined {
        if (this.locked) return this.locked.value;
        if (!this.valueCached) {
            this.cachedValue = Array.from(this.values()).pop() ?? this.defaultValue;
            this.valueCached = true;
        }
        return this.cachedValue;
    }

    private invalidate() {
        this.stateCached = false;
        this.valueCached = false;
        delete this.cachedState;
        delete this.cachedValue;
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
