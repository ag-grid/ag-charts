import type { Listeners } from '../../util/listeners';
export type PreventableEvent = {
    preventDefault(): void;
};
export type Unpreventable<T extends PreventableEvent> = Omit<T, keyof PreventableEvent>;
export declare function buildPreventable<T>(obj: T & {
    sourceEvent?: PreventableEvent;
}): typeof obj & PreventableEvent;
export declare function dispatchTypedEvent<T extends string, E extends {
    type: T;
}, L extends Listeners<T, (event: PreventableEvent & E) => void>>(listeners: L, event: E): void;
