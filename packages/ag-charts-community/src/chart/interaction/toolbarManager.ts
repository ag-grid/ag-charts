import { BaseManager } from './baseManager';

type EventTypes = ToolbarButtonUpdated | ToolbarButtonPressed;
type ToolbarButtonUpdated = 'button-group-updated';
type ToolbarButtonPressed = 'button-pressed';

export type ToolbarEvent = ToolbarButtonUpdatedEvent | ToolbarButtonPressEvent;

interface Event<T extends EventTypes> {
    type: T;
}

export interface ToolbarButton {
    id: string;
    label: string;
    value: any;
}

export interface ToolbarButtonUpdatedEvent extends Event<ToolbarButtonUpdated> {
    id: string;
    buttons: ToolbarButton[];
}

export interface ToolbarButtonPressEvent extends Event<ToolbarButtonPressed> {
    id: string;
    groupId: string | undefined;
    value: any;
}

export class ToolbarManager extends BaseManager<EventTypes, ToolbarEvent> {
    setButtonGroup(id: string, buttons: ToolbarButton[]) {
        this.listeners.dispatch('button-group-updated', {
            type: 'button-group-updated',
            id,
            buttons,
        });
    }

    pressButton(id: string, groupId: string | undefined, value: any) {
        this.listeners.dispatch('button-pressed', { type: 'button-pressed', id, groupId, value });
    }
}
