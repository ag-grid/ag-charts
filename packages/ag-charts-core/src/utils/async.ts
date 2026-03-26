/**
 * Primitive to allow coordination between async processes.
 */
export class AsyncAwaitQueue {
    private readonly queue: (() => void)[] = [];

    /** Await another async process to call notify(). */
    public waitForCompletion(timeout = 50) {
        const queue = this.queue;

        function createCompletionPromise(resolve: (value: boolean) => void): void {
            function successFn(): void {
                clearTimeout(timeoutHandle);
                resolve(true);
            }

            function timeoutFn(): void {
                const queueIndex = queue.indexOf(successFn);
                if (queueIndex < 0) return;

                queue.splice(queueIndex, 1);
                resolve(false);
            }

            const timeoutHandle = setTimeout(timeoutFn, timeout);
            queue.push(successFn);
        }

        return new Promise<boolean>(createCompletionPromise);
    }

    /** Trigger any await()ing async processes to continue. */
    public notify() {
        for (const cb of this.queue.splice(0)) {
            cb();
        }
    }
}

export function pause(delayMilliseconds = 0) {
    function resolveAfterDelay(resolve: (_result: any) => void): void {
        setTimeout(resolve, delayMilliseconds);
    }

    return new Promise(resolveAfterDelay);
}

/** Wraps a promise with a timeout. Rejects with an error if the timeout expires before resolution. */
export async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage = `Timeout after ${timeoutMs}ms`
): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });
    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        clearTimeout(timer!);
    }
}
