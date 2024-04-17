import type { AgToolbarOptions } from '../../options/chart/toolbarOptions';
import type { ToolbarGroup } from '../toolbar/toolbarTypes';
import { BaseManager } from './baseManager';

type EventTypes = ToolbarButtonPressed | ToolbarButtonToggled | ToolbarGroupToggled;
type ToolbarButtonPressed = 'button-pressed';
type ToolbarButtonToggled = 'button-toggled';
type ToolbarGroupToggled = 'group-toggled';

type ToolbarEvent = ToolbarButtonPressedEvent | ToolbarButtonToggledEvent | ToolbarGroupToggledEvent;
type ToolbarEventButtonValue<T extends ToolbarGroup> = NonNullable<
    NonNullable<AgToolbarOptions[T]>['buttons']
>[number]['value'];

interface Event<T extends EventTypes> {
    type: T;
}

export interface ToolbarGroupToggledEvent extends Event<ToolbarGroupToggled> {
    group: ToolbarGroup;
    visible: boolean;
}

export interface ToolbarButtonPressedEvent<T = any> extends Event<ToolbarButtonPressed> {
    group: ToolbarGroup;
    value: T;
}

export interface ToolbarButtonToggledEvent<T = any> extends Event<ToolbarButtonToggled> {
    group: ToolbarGroup;
    value: T;
    enabled: boolean;
}

export class ToolbarManager extends BaseManager<EventTypes, ToolbarEvent> {
    static isGroup<T extends ToolbarGroup>(
        group: T,
        event: ToolbarEvent
    ): event is ToolbarButtonPressedEvent<ToolbarEventButtonValue<T>> {
        return event.group === group;
    }

    constructor(readonly element: HTMLElement) {
        super();
    }

    pressButton(group: ToolbarGroup, value: any) {
        this.listeners.dispatch('button-pressed', { type: 'button-pressed', group, value });
    }

    toggleGroup(group: ToolbarGroup, visible: boolean) {
        this.listeners.dispatch('group-toggled', { type: 'group-toggled', group, visible });
    }

    toggleButton<T extends ToolbarGroup>(group: T, value: ToolbarEventButtonValue<T>, enabled: boolean) {
        this.listeners.dispatch('button-toggled', { type: 'button-toggled', group, value, enabled });
    }
}
