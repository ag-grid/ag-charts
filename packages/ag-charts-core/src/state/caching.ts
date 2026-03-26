export class SimpleCache<T> {
    protected result?: T;
    constructor(protected readonly getter: () => T) {}
    get(): T {
        this.result ??= this.getter();
        return this.result;
    }
    clear(): void {
        this.result = undefined;
    }
}

export class WeakCache<T extends WeakKey> {
    protected result?: WeakRef<T>;
    constructor(protected readonly getter: () => T) {}
    get(): T {
        let result = this.result?.deref();
        if (result) return result;
        result = this.getter();
        this.result = new WeakRef(result);
        return result;
    }
    clear(): void {
        this.result = undefined;
    }
}
