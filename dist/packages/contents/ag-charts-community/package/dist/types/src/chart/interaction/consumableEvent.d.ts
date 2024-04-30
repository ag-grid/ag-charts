import type { Listeners } from '../../util/listeners';
export type ConsumableEvent = {
    /** Consume the event, don't notify other listeners! */
    consume(): void;
    consumed?: boolean;
};
type TypedConsumableEvent<TType extends string> = ConsumableEvent & {
    type: TType;
};
type TypedListener<TType extends string, TEvent extends TypedConsumableEvent<TType>> = Listeners<TType, (event: TEvent) => void>;
export declare function buildConsumable<T>(obj: T & {
    sourceEvent?: Event | ConsumableEvent;
}): T & ConsumableEvent;
export declare function dispatchTypedConsumable<TType extends string, TTypeSubset extends TType, TEvent extends TypedConsumableEvent<TTypeSubset>, TListeners extends TypedListener<TType, TEvent>>(listeners: TListeners, type: TTypeSubset, event: TEvent): void;
export {};
