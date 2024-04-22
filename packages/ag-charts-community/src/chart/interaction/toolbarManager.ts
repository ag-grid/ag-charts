import type { AgToolbarOptions } from '../../options/chart/toolbarOptions';
import type { ToolbarGroup } from '../toolbar/toolbarTypes';
import { BaseManager } from './baseManager';

type EventTypes = ToolbarButtonPressed | ToolbarButtonToggled | ToolbarGroupToggled | ToolbarProxyGroupOptions;
type ToolbarButtonPressed = 'button-pressed';
type ToolbarButtonToggled = 'button-toggled';
type ToolbarGroupToggled = 'group-toggled';
type ToolbarProxyGroupOptions = 'proxy-group-options';

type ToolbarEvent =
    | ToolbarButtonPressedEvent
    | ToolbarButtonToggledEvent
    | ToolbarGroupToggledEvent
    | ToolbarProxyGroupOptionsEvent;
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

export interface ToolbarProxyGroupOptionsEvent extends Event<ToolbarProxyGroupOptions> {
    group: ToolbarGroup;
    options: Partial<NonNullable<AgToolbarOptions[ToolbarGroup]>>;
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

    proxyGroupOptions<T extends ToolbarGroup>(group: T, options: Partial<AgToolbarOptions[T]>) {
        this.listeners.dispatch('proxy-group-options', { type: 'proxy-group-options', group, options });
    }
}
