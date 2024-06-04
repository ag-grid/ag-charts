import type { Listeners } from '../../util/listeners';

export type PreventableEvent = {
    preventDefault(): void;
};

export function buildPreventable<T>(obj: T & { sourceEvent?: PreventableEvent }): T & PreventableEvent {
    return { ...obj, preventDefault: () => obj.sourceEvent?.preventDefault() };
}

export function dispatchTypedEvent<
    T extends string,
    E extends { type: T },
    L extends Listeners<T, (event: PreventableEvent & E) => void>,
>(listeners: L, event: E) {
    listeners.dispatchWrapHandlers(event.type, (handler, e) => handler(e), buildPreventable(event));
}
