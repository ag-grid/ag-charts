export class AsyncAwaitQueue {
    private readonly queue: (() => void)[] = [];

    public await(timeout = 50) {
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

    public notify() {
        this.queue.splice(0).forEach((cb) => cb());
    }
}

export function pause() {
    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
}
