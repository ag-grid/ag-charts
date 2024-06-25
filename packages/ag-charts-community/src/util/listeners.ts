import { Logger } from './logger';

type Handler = (...args: any[]) => void;

export type Listener<H extends Handler> = {
    symbol?: Symbol;
    handler: H;
};

export class Listeners<EventType extends string, EventHandler extends Handler> {
    protected readonly registeredListeners: Map<EventType, Listener<EventHandler>[]> = new Map();

    public addListener(eventType: EventType, handler: EventHandler) {
        const record = { symbol: Symbol(eventType), handler };

        if (this.registeredListeners.has(eventType)) {
            this.registeredListeners.get(eventType)!.push(record);
        } else {
            this.registeredListeners.set(eventType, [record]);
        }

        return () => this.removeListener(record.symbol);
    }

    private removeListener(eventSymbol: symbol) {
        for (const [type, listeners] of this.registeredListeners.entries()) {
            const matchIndex = listeners.findIndex((listener) => listener.symbol === eventSymbol);
            if (matchIndex >= 0) {
                listeners.splice(matchIndex, 1);
                if (listeners.length === 0) {
                    this.registeredListeners.delete(type);
                }
                break;
            }
        }
    }

    public dispatch(eventType: EventType, ...params: Parameters<EventHandler>): void {
        for (const listener of this.getListenersByType(eventType)) {
            try {
                listener.handler(...params);
            } catch (e) {
                Logger.errorOnce(e);
            }
        }
    }

    public dispatchWrapHandlers(
        eventType: EventType,
        wrapFn: (handler: EventHandler, ...params: Parameters<EventHandler>) => void,
        ...params: Parameters<EventHandler>
    ) {
        for (const listener of this.getListenersByType(eventType)) {
            try {
                wrapFn(listener.handler, ...params);
            } catch (e) {
                Logger.errorOnce(e);
            }
        }
    }

    protected getListenersByType(eventType: EventType): Listener<EventHandler>[] {
        return this.registeredListeners.get(eventType) ?? [];
    }

    destroy() {
        this.registeredListeners.clear();
    }
}
