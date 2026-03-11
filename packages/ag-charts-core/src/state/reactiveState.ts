type ValueGetter<StateMap extends object> = {
    <K extends keyof StateMap>(key: K): StateMap[K] | undefined;
    <K extends keyof StateMap>(key: K, subPath: string): unknown;
};
type StateObserver<StateMap extends object> = (valueGetter: ValueGetter<StateMap>) => void;

function getNestedValue(value: unknown, subPath: string[]): unknown {
    let current = value;
    for (const key of subPath) {
        if (current == null || typeof current !== 'object') return;
        current = (current as Record<string, unknown>)[key];
    }
    return current;
}

export class ReactiveState<StateMap extends object = Record<string, unknown>> {
    private readonly dirtyKeys = new Set<keyof StateMap>();
    private readonly stateMap = new Map<
        keyof StateMap,
        {
            value: StateMap[keyof StateMap] | undefined;
            flushedValue: StateMap[keyof StateMap] | undefined;
            // Dot-joined sub-paths per observer; '' = whole-key (always notify on change).
            observers: Map<StateObserver<StateMap>, Set<string>>;
        }
    >();
    private isFlushing = false;

    private getState(key: keyof StateMap) {
        let keyState = this.stateMap.get(key);
        if (!keyState) {
            keyState = { value: undefined, flushedValue: undefined, observers: new Map() };
            this.stateMap.set(key, keyState);
        }
        return keyState;
    }

    /**
     * Registers an observer notified when any of its accessed state keys change.
     *
     * Dependencies are captured once during the initial synchronous call to `callback` and are
     * not re-tracked thereafter. The observer will only be notified for keys accessed during
     * that first invocation. To change the set of tracked keys, unsubscribe and re-observe.
     *
     * When a nested path is accessed via `get(key, ...subPath)`, the observer is only notified
     * if the value at that specific nested path is changed by reference.
     *
     * @param callback The observer function that receives a `valueGetter` to read state.
     * @returns A function to unsubscribe the observer.
     */
    observe(callback: StateObserver<StateMap>) {
        const observeKeys = new Map<keyof StateMap, Set<string>>();
        callback((key, subPath: string = '') => {
            let paths = observeKeys.get(key);
            if (paths == null) {
                paths = new Set<string>();
                observeKeys.set(key, paths);
            }
            paths.add(subPath);
            return this.getValue(key, subPath);
        });
        for (const [key, paths] of observeKeys) {
            this.getState(key).observers.set(callback, paths);
        }
        return () => {
            for (const key of observeKeys.keys()) {
                this.stateMap.get(key)?.observers.delete(callback);
            }
        };
    }

    getValue<K extends keyof StateMap>(key: K): StateMap[K] | undefined;
    getValue<K extends keyof StateMap>(key: K, subPath: string): unknown;
    getValue<K extends keyof StateMap>(key: K, subPath: string = ''): unknown {
        const value = this.stateMap.get(key)?.value;
        return subPath.length === 0 ? value : getNestedValue(value, subPath.split('.'));
    }

    setValue<K extends keyof StateMap>(key: K, value: StateMap[K]) {
        this.getState(key).value = value;
        this.dirtyKeys.add(key);
    }

    flushChanges() {
        if (this.isFlushing) return;
        this.isFlushing = true;
        try {
            const valueGetter = this.getValue.bind(this);
            const snapshotKeys = new Set(this.dirtyKeys);

            this.dirtyKeys.clear();

            for (const observer of this.collectObservers(snapshotKeys)) {
                observer(valueGetter);
            }
        } finally {
            this.isFlushing = false;
        }
    }

    destroy(): void {
        for (const { observers } of this.stateMap.values()) {
            observers.clear();
        }
        this.dirtyKeys.clear();
        this.stateMap.clear();
    }

    private collectObservers(snapshotKeys: Set<keyof StateMap>) {
        const stateObservers = new Set<StateObserver<StateMap>>();
        for (const key of snapshotKeys) {
            const keyState = this.getState(key);
            const { flushedValue: oldValue, value: newValue } = keyState;
            if (oldValue === newValue) continue;
            keyState.flushedValue = newValue;
            for (const [observer, subPaths] of keyState.observers) {
                if (subPaths.size === 0 || subPaths.has('')) {
                    stateObservers.add(observer);
                    continue;
                }
                for (const subPath of subPaths) {
                    const subPathParts = subPath.split('.');
                    if (getNestedValue(oldValue, subPathParts) !== getNestedValue(newValue, subPathParts)) {
                        stateObservers.add(observer);
                        break;
                    }
                }
            }
        }
        return stateObservers;
    }
}
