import { BaseManager } from './baseManager';

export type ToolbarSection = 'annotations' | 'ranges';

type EventTypes = ToolbarButtonPressed | ToolbarSectionToggled;
type ToolbarButtonPressed = 'button-pressed';
type ToolbarSectionToggled = 'section-toggled';

type ToolbarEvent = ToolbarButtonPressedEvent | ToolbarSectionToggledEvent;

interface Event<T extends EventTypes> {
    type: T;
}

export interface ToolbarSectionToggledEvent extends Event<ToolbarSectionToggled> {
    section: ToolbarSection;
    visible: boolean;
}

export interface ToolbarButtonPressedEvent extends Event<ToolbarButtonPressed> {
    section: ToolbarSection;
    value: any;
}

export class ToolbarManager extends BaseManager<EventTypes, ToolbarEvent> {
    constructor(readonly element: HTMLElement) {
        super();
    }

    pressButton(section: ToolbarSection, value: any) {
        this.listeners.dispatch('button-pressed', { type: 'button-pressed', section, value });
    }

    toggleSection(section: ToolbarSection, visible: boolean) {
        this.listeners.dispatch('section-toggled', { type: 'section-toggled', section, visible });
    }
}
