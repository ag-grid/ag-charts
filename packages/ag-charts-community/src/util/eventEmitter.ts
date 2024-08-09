export type EventListener<T> = (event: T) => void;

export class EventEmitter<EventMap extends object> {
    private events = new Map<keyof EventMap, Set<EventListener<any>>>();

    /**
     * Registers an event listener.
     * @param eventName The event name to listen for.
     * @param listener The callback to be invoked on the event.
     * @returns A function to unregister the listener.
     */
    on<K extends keyof EventMap>(eventName: K, listener: EventListener<EventMap[K]>) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, new Set());
        }
        this.events.get(eventName)?.add(listener);
        return () => this.off(eventName, listener);
    }

    /**
     * Unregisters an event listener.
     * @param eventName The event name to stop listening for.
     * @param listener The callback to be removed.
     */
    off<K extends keyof EventMap>(eventName: K, listener: EventListener<EventMap[K]>) {
        const eventListeners = this.events.get(eventName);
        if (eventListeners) {
            eventListeners.delete(listener);
            if (eventListeners.size === 0) {
                this.events.delete(eventName);
            }
        }
    }

    /**
     * Emits an event to all registered listeners.
     * @param eventName The name of the event to emit.
     * @param event The event payload.
     */
    emit<K extends keyof EventMap>(eventName: K, event: EventMap[K]) {
        this.events.get(eventName)?.forEach((callback) => callback(event));
    }
}
