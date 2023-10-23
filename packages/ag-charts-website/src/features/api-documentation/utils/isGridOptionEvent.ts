import type { IEvent, InterfaceEntry } from '../types';

export function isGridOptionEvent(gridProp?: InterfaceEntry): gridProp is IEvent {
    return Boolean(gridProp?.meta?.isEvent);
}
