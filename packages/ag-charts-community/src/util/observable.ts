export interface TypedEvent {
    readonly type: string;
}

export type TypedEventListener = (event: TypedEvent) => any;

export class Observable {
    private readonly eventListeners: Map<string, Set<TypedEventListener>> = new Map();

    addEventListener(eventType: string, listener: TypedEventListener): void {
        if (typeof listener !== 'function') {
            throw new TypeError('AG Charts - listener must be a Function');
        }

        const eventTypeListeners = this.eventListeners.get(eventType);

        if (eventTypeListeners) {
            eventTypeListeners.add(listener);
        } else {
            this.eventListeners.set(eventType, new Set([listener]));
        }
    }

    removeEventListener(type: string, listener: TypedEventListener): void {
        const listeners = this.eventListeners.get(type);
        if (listeners == null) return;

        listeners.delete(listener);
        if (listeners.size === 0) {
            this.eventListeners.delete(type);
        }
    }

    hasEventListener(type: string): boolean {
        return this.eventListeners.has(type);
    }

    clearEventListeners() {
        this.eventListeners.clear();
    }

    protected fireEvent<TEvent extends TypedEvent>(event: TEvent): void {
        const listeners = this.eventListeners.get(event.type);
        if (listeners) {
            for (const listener of listeners) {
                listener(event);
            }
        }
    }
}
