import { BaseManager } from './baseManager';

export type ToolbarGroup = 'annotations' | 'ranges';

type EventTypes = ToolbarButtonPressed | ToolbarGroupToggled;
type ToolbarButtonPressed = 'button-pressed';
type ToolbarGroupToggled = 'group-toggled';

type ToolbarEvent = ToolbarButtonPressedEvent | ToolbarGroupToggledEvent;

interface Event<T extends EventTypes> {
    type: T;
}

export interface ToolbarGroupToggledEvent extends Event<ToolbarGroupToggled> {
    group: ToolbarGroup;
    visible: boolean;
}

export interface ToolbarButtonPressedEvent extends Event<ToolbarButtonPressed> {
    group: ToolbarGroup;
    value: any;
}

export class ToolbarManager extends BaseManager<EventTypes, ToolbarEvent> {
    constructor(readonly element: HTMLElement) {
        super();
    }

    pressButton(group: ToolbarGroup, value: any) {
        this.listeners.dispatch('button-pressed', { type: 'button-pressed', group, value });
    }

    toggleGroup(group: ToolbarGroup, visible: boolean) {
        this.listeners.dispatch('group-toggled', { type: 'group-toggled', group, visible });
    }
}
