import type { Listeners } from '../../util/listeners';

export type PreventableEvent = {
    preventDefault(): void;
};

export type Unpreventable<T extends PreventableEvent> = Omit<T, keyof PreventableEvent>;

export function buildPreventable<T>(obj: T & { sourceEvent?: PreventableEvent }): typeof obj & PreventableEvent {
    const self: typeof obj & PreventableEvent = {
        ...obj,
        preventDefault() {
            self.sourceEvent?.preventDefault();
        },
    };
    return self;
}

export function dispatchTypedEvent<
    T extends string,
    E extends { type: T },
    L extends Listeners<T, (event: PreventableEvent & E) => void>,
>(listeners: L, event: E) {
    listeners.dispatchWrapHandlers(event.type, (handler, e) => handler(e), buildPreventable(event));
}
