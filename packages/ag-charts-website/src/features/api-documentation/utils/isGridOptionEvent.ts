import type { IEvent, InterfaceEntry } from '../types';

export function isGridOptionEvent(gridProp?: InterfaceEntry): gridProp is IEvent {
    return gridProp && gridProp.meta && gridProp.meta.isEvent;
}
