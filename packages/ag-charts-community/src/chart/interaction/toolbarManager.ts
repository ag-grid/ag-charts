import type { AgToolbarOptions } from '../../options/chart/toolbarOptions';
import { BaseManager } from '../baseManager';
import type { ToolbarGroup } from '../toolbar/toolbarTypes';

type EventTypes =
    | 'button-pressed'
    | 'button-toggled'
    | 'floating-anchor-changed'
    | 'group-toggled'
    | 'proxy-group-options';
type ToolbarEvent =
    | ToolbarButtonPressedEvent
    | ToolbarButtonToggledEvent
    | ToolbarFloatingAnchorChangedEvent
    | ToolbarGroupToggledEvent
    | ToolbarProxyGroupOptionsEvent;
type ToolbarEventButtonValue<T extends ToolbarGroup> = NonNullable<
    NonNullable<AgToolbarOptions[T]>['buttons']
>[number]['value'];

interface Event<T extends EventTypes> {
    type: T;
    group: ToolbarGroup;
}

export interface ToolbarGroupToggledEvent extends Event<'group-toggled'> {
    caller: string;
    visible: boolean;
}

export interface ToolbarFloatingAnchorChangedEvent extends Event<'floating-anchor-changed'> {
    anchor: { x: number; y: number };
}

export interface ToolbarButtonPressedEvent<T = any> extends Event<'button-pressed'> {
    value: T;
}

export interface ToolbarButtonToggledEvent<T = any> extends Event<'button-toggled'> {
    value: T;
    active: boolean;
    enabled: boolean;
    visible: boolean;
}

export interface ToolbarProxyGroupOptionsEvent extends Event<'proxy-group-options'> {
    caller: string;
    options: Partial<NonNullable<AgToolbarOptions[ToolbarGroup]>>;
}

export class ToolbarManager extends BaseManager<EventTypes, ToolbarEvent> {
    static isGroup<T extends ToolbarGroup>(
        group: T,
        event: ToolbarEvent
    ): event is ToolbarButtonPressedEvent<ToolbarEventButtonValue<T>> {
        return event.group === group;
    }

    pressButton(group: ToolbarGroup, value: any) {
        this.listeners.dispatch('button-pressed', { type: 'button-pressed', group, value });
    }

    toggleButton<T extends ToolbarGroup>(
        group: T,
        value: ToolbarEventButtonValue<T>,
        options: { active?: boolean; enabled?: boolean; visible?: boolean }
    ) {
        const { active = false, enabled = true, visible = true } = options;
        this.listeners.dispatch('button-toggled', { type: 'button-toggled', group, value, active, enabled, visible });
    }

    toggleGroup(caller: string, group: ToolbarGroup, visible: boolean) {
        this.listeners.dispatch('group-toggled', { type: 'group-toggled', caller, group, visible });
    }

    changeFloatingAnchor(group: ToolbarGroup, anchor: { x: number; y: number }) {
        this.listeners.dispatch('floating-anchor-changed', { type: 'floating-anchor-changed', group, anchor });
    }

    proxyGroupOptions<T extends ToolbarGroup>(caller: string, group: T, options: Partial<AgToolbarOptions[T]>) {
        this.listeners.dispatch('proxy-group-options', { type: 'proxy-group-options', caller, group, options });
    }
}
