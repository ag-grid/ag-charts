import { Logger } from './logger';
import { isPlainObject } from './type-guards';

type Handler = (...args: any[]) => void;

const immediatePropagationStoppedKey = Symbol('immediatePropagationStopped');

export interface StoppableEvent {
    stopImmediatePropagation(): void;
    [immediatePropagationStoppedKey]: boolean;
}

export function buildStoppable<T extends object>(obj: T): T & StoppableEvent {
    const out: T & StoppableEvent = {
        ...obj,
        [immediatePropagationStoppedKey]: false,
        stopImmediatePropagation() {
            out[immediatePropagationStoppedKey] = true;
        },
    };

    return out;
}

export function immediatePropagationStopped(obj: any): boolean {
    return isPlainObject(obj) && obj[immediatePropagationStoppedKey] === true;
}

export type Listener<H extends Handler> = {
    symbol?: Symbol;
    handler: H;
};

export class Listeners<EventType extends string, EventHandler extends Handler> {
    protected readonly registeredListeners: Map<EventType, Listener<EventHandler>[]> = new Map();

    public addListener<T extends EventType>(eventType: T, handler: EventHandler) {
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

            if (params.length === 1 && immediatePropagationStopped(params[0])) return;
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
