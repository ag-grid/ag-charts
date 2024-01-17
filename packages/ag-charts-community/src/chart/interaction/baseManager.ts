import { Listeners } from '../../util/listeners';

export abstract class BaseManager<EventType extends string = never, Event extends { type: any } = never, Meta = never> {
    protected readonly listeners = new Listeners<EventType, (event: Event) => void, Meta>();

    public addListener<T extends EventType>(type: T, handler: (event: Event & { type: T }) => void, meta?: Meta) {
        return this.listeners.addListener(type, handler, meta);
    }

    public removeListener(listenerSymbol: symbol) {
        this.listeners.removeListener(listenerSymbol);
    }

    public destroy() {
        this.listeners.destroy();
    }
}
