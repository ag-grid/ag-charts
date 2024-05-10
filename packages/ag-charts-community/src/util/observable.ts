export interface TypedEvent {
    readonly type: string;
}

export type TypedEventListener = (event: TypedEvent) => any;

export class Observable {
    private readonly eventListeners: Map<string, Set<TypedEventListener>> = new Map();

    addEventListener(eventType: string, listener: TypedEventListener): void {
        if (typeof listener !== 'function') {
            throw new Error('AG Charts - listener must be a Function');
        }

        const eventTypeListeners = this.eventListeners.get(eventType);

        if (eventTypeListeners) {
            eventTypeListeners.add(listener);
        } else {
            this.eventListeners.set(eventType, new Set([listener]));
        }
    }

    removeEventListener(type: string, listener: TypedEventListener): void {
        this.eventListeners.get(type)?.delete(listener);
        if (this.eventListeners.size === 0) {
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
        this.eventListeners.get(event.type)?.forEach((listener) => listener(event));
    }
}
