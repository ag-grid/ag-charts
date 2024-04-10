import type { Listeners } from '../../util/listeners';

export type ConsumableEvent = {
    /** Consume the event, don't notify other listeners! */
    consume(): void;
    consumed?: boolean;
};

type TypedConsumableEvent<TType extends string> = ConsumableEvent & { type: TType };
type TypedListener<TType extends string, TEvent extends TypedConsumableEvent<TType>> = Listeners<
    TType,
    (event: TEvent) => void
>;

export function buildConsumable<T>(obj: T): T & ConsumableEvent {
    const builtEvent = {
        ...obj,
        consumed: false,
        consume() {
            builtEvent.consumed = true;
        },
    };
    return builtEvent;
}

function buildConsumptionHandler<T extends ConsumableEvent>(): (handler: (arg: T) => void, arg: T) => void {
    return (handler, e) => {
        if (!e.consumed) {
            handler(e);
        }
    };
}

export function dispatchTypedConsumable<
    TType extends string,
    TTypeSubset extends TType,
    TEvent extends TypedConsumableEvent<TTypeSubset>,
    TListeners extends TypedListener<TType, TEvent>,
>(listeners: TListeners, type: TTypeSubset, event: TEvent) {
    listeners.dispatchWrapHandlers(type, buildConsumptionHandler(), event);
}
