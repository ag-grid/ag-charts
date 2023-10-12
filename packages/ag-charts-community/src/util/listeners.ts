import { Logger } from './logger';

type Handler = (...args: any[]) => any;

export type Listener<H extends Handler, Meta = unknown> = {
    symbol?: Symbol;
    handler: H;
    meta?: Meta;
};

export class Listeners<EventType extends string, EventHandler extends Handler, Meta = unknown> {
    protected readonly registeredListeners: Map<EventType, Listener<EventHandler, Meta>[]> = new Map();

    public addListener(eventType: EventType, handler: EventHandler, meta?: Meta) {
        const record = { symbol: Symbol(eventType), handler, meta };

        if (this.registeredListeners.has(eventType)) {
            this.registeredListeners.get(eventType)!.push(record);
        } else {
            this.registeredListeners.set(eventType, [record]);
        }

        return () => this.removeListener(record.symbol);
    }

    public removeListener(eventSymbol: symbol) {
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

    public dispatch<R = never>(eventType: EventType, ...params: Parameters<EventHandler>): R[] | undefined {
        // This is a utility class to store all the results of Listeners (or do nothing
        // if R = void).
        class ResultArray<R> {
            results?: R[] = undefined;

            push(result?: R) {
                if (result === undefined) return;

                this.results ??= [];
                this.results.push(result);
            }
        }
        const results: ResultArray<R> = new ResultArray<R>();
        for (const listener of this.getListenersByType(eventType)) {
            try {
                results.push(listener.handler(...params));
            } catch (e) {
                Logger.errorOnce(e);
            }
        }
        return results.results;
    }

    public dispatchWrapHandlers(
        eventType: EventType,
        wrapFn: (handler: EventHandler, meta?: Meta, ...params: Parameters<EventHandler>) => void,
        ...params: Parameters<EventHandler>
    ) {
        for (const listener of this.getListenersByType(eventType)) {
            try {
                wrapFn(listener.handler, listener.meta, ...params);
            } catch (e) {
                Logger.errorOnce(e);
            }
        }
    }

    protected getListenersByType(eventType: EventType): Listener<EventHandler, Meta>[] {
        return this.registeredListeners.get(eventType) ?? [];
    }
}
