import { BaseManager } from './baseManager';

export type ToolbarSection = 'ranges';

type EventTypes = ToolbarButtonPressed | ToolbarVisibility;
type ToolbarButtonPressed = 'button-pressed';
type ToolbarVisibility = 'visibility';

type ToolbarEvent = ToolbarButtonPressedEvent | ToolbarVisibilityEvent;

interface Event<T extends EventTypes> {
    type: T;
}

export interface ToolbarVisibilityEvent extends Event<ToolbarVisibility> {
    section: ToolbarSection;
    visible: boolean;
}

export interface ToolbarButtonPressedEvent extends Event<ToolbarButtonPressed> {
    section: ToolbarSection;
    value: any;
}

export class ToolbarManager extends BaseManager<EventTypes, ToolbarEvent> {
    pressButton(section: ToolbarSection, value: any) {
        this.listeners.dispatch('button-pressed', { type: 'button-pressed', section, value });
    }

    toggleSection(section: ToolbarSection, visible: boolean) {
        this.listeners.dispatch('visibility', { type: 'visibility', section, visible });
    }
}
