import { DestroyFns, Destructible } from '../util/destroy';
import { Listeners } from '../util/listeners';

export abstract class BaseManager<
    EventType extends string = never,
    Event extends { type: any } = never,
> extends Destructible {
    protected readonly listeners = new Listeners<EventType, (event: Event) => void>();
    protected readonly destroyFns = new DestroyFns();

    public addListener<T extends EventType>(type: T, handler: (event: Event & { type: T }) => void) {
        return this.listeners.addListener(type, handler);
    }
}
