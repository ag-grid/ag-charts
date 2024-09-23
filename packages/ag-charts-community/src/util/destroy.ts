export class DestroyFns {
    private destroyFns: (() => void)[] = [];

    destroy() {
        this.destroyFns.forEach((fn) => fn());
        this.destroyFns.length = 0;
    }

    setFns(destroyFns: (() => void)[]) {
        this.destroy();
        this.destroyFns = destroyFns;
    }
}
