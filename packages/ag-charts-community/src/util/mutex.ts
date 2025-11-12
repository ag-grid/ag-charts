type MutexCallback = (...args: any[]) => Promise<void> | void;

export class Mutex {
    private available: boolean = true;
    private readonly acquireQueue: [MutexCallback, () => void, (reason?: any) => void][] = [];

    public acquire(cb: MutexCallback): Promise<void> {
        return new Promise((resolve, reject) => {
            this.acquireQueue.push([cb, resolve, reject]);

            if (this.available) {
                this.dispatchNext().catch(reject);
            }
        });
    }

    public async acquireImmediately(cb: MutexCallback) {
        if (!this.available) {
            return false;
        }

        await this.acquire(cb);
        return true;
    }

    public async waitForClearAcquireQueue() {
        return this.acquire(() => Promise.resolve(undefined));
    }

    private async dispatchNext() {
        this.available = false;

        let [next, done, reject] = this.acquireQueue.shift() ?? [];
        while (next) {
            try {
                await next();
                done?.();
            } catch (error) {
                reject?.(error);
            }

            [next, done, reject] = this.acquireQueue.shift() ?? [];
        }

        this.available = true;
    }
}
