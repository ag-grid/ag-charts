import { Logger } from './logger';

type MutexCallback = () => Promise<void>;

export class Mutex {
    private available: boolean = true;
    private acquireQueue: [MutexCallback, () => void][] = [];

    public acquire(cb: MutexCallback): Promise<void> {
        return new Promise((resolve) => {
            this.acquireQueue.push([cb, resolve]);

            if (this.available) {
                this.dispatchNext();
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

    private async dispatchNext() {
        this.available = false;

        let [next, done] = this.acquireQueue.shift() ?? [];
        while (next) {
            try {
                await next();
                done?.();
            } catch (error) {
                Logger.error('mutex callback error', error);
                done?.();
            }

            [next, done] = this.acquireQueue.shift() ?? [];
        }

        this.available = true;
    }
}
