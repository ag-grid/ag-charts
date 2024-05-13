type Destroyable = {} | { destroy(): void };
export class ObjectDestroyer {
    private readonly objs: Destroyable[];
    constructor(...objs: Destroyable[]) {
        this.objs = [...objs].reverse();
    }
    destroy() {
        this.objs.forEach((o) => {
            if ('destroy' in o && typeof o.destroy === 'function') {
                o.destroy();
            }
        });
    }
}
