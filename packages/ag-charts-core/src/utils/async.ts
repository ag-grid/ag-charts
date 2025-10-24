/**
 * Primitive to allow coordination between async processes.
 */
export class AsyncAwaitQueue {
    private readonly queue: (() => void)[] = [];

    /** Await another async process to call notify(). */
    public waitForCompletion(timeout = 50) {
        return new Promise<boolean>((resolve) => {
            const successFn = () => {
                clearTimeout(timeoutHandle);
                resolve(true);
            };
            const timeoutFn = () => {
                const queueIndex = this.queue.indexOf(successFn);
                if (queueIndex < 0) return;

                this.queue.splice(queueIndex, 1);
                resolve(false);
            };
            const timeoutHandle = setTimeout(timeoutFn, timeout);
            this.queue.push(successFn);
        });
    }

    /** Trigger any await()ing async processes to continue. */
    public notify() {
        for (const cb of this.queue.splice(0)) {
            cb();
        }
    }
}

export function pause(delayMilliseconds = 0) {
    return new Promise((resolve) => {
        setTimeout(resolve, delayMilliseconds);
    });
}
