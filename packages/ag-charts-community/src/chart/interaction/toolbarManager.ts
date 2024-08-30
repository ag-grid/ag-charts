import type { AgIconName, AgToolbarOptions } from 'ag-charts-types';

import type { DOMManager } from '../../dom/domManager';
import type { BBox } from '../../scene/bbox';
import { BaseManager } from '../baseManager';
import { TOOLBAR_POSITIONS, type ToolbarGroup } from '../toolbar/toolbarTypes';

type EventTypes =
    | 'button-pressed'
    | 'button-toggled'
    | 'button-updated'
    | 'button-moved'
    | 'cancelled'
    | 'floating-anchor-changed'
    | 'group-toggled'
    | 'group-updated'
    | 'proxy-group-options';
type ToolbarEvent =
    | ToolbarButtonPressedEvent
    | ToolbarButtonToggledEvent
    | ToolbarButtonUpdatedEvent
    | ToolbarButtonMovedEvent
    | ToolbarCancelledEvent
    | ToolbarFloatingAnchorChangedEvent
    | ToolbarGroupToggledEvent
    | ToolbarGroupUpdatedEvent
    | ToolbarProxyGroupOptionsEvent;
type ToolbarEventButtonValue<T extends ToolbarGroup> = NonNullable<
    NonNullable<AgToolbarOptions[T]>['buttons']
>[number]['value'];

interface ToolbarBaseEvent<T extends EventTypes> {
    type: T;
    group: ToolbarGroup;
}

export interface ToolbarGroupToggledEvent extends ToolbarBaseEvent<'group-toggled'> {
    caller: string;
    active: boolean | undefined;
    visible: boolean | undefined;
}

export interface ToolbarGroupUpdatedEvent extends ToolbarBaseEvent<'group-updated'> {}

export interface ToolbarCancelledEvent extends ToolbarBaseEvent<'cancelled'> {}

export interface ToolbarFloatingAnchorChangedEvent extends ToolbarBaseEvent<'floating-anchor-changed'> {
    anchor: { x: number; y: number; position?: 'right' | 'above' | 'above-left' | 'below' };
}

export interface ToolbarButtonPressedEvent<T = any> extends ToolbarBaseEvent<'button-pressed'> {
    id: string;
    value: T;
    rect: BBox;
    sourceEvent: Event;
}

export interface ToolbarButtonToggledEvent<_T = any> extends ToolbarBaseEvent<'button-toggled'> {
    id: string;
    active: boolean;
    enabled: boolean;
    visible: boolean;
    checked: boolean;
}

export interface ToolbarButtonUpdatedEvent extends ToolbarBaseEvent<'button-updated'> {
    id: string;
    label?: string | undefined;
    icon?: AgIconName | undefined;
    fill?: string | undefined;
}

export interface ToolbarButtonMovedEvent<T = any> extends ToolbarBaseEvent<'button-moved'> {
    value: T;
    rect: BBox;
    groupRect: BBox;
}

export interface ToolbarProxyGroupOptionsEvent extends ToolbarBaseEvent<'proxy-group-options'> {
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

    static isChildElement(domManager: DOMManager, element: HTMLElement) {
        for (const position of TOOLBAR_POSITIONS) {
            if (domManager.isManagedChildDOMElement(element, 'canvas-overlay', `toolbar-${position}`)) {
                return true;
            }
        }
        return false;
    }

    pressButton(group: ToolbarGroup, id: string, value: any, rect: BBox, sourceEvent: Event) {
        this.listeners.dispatch('button-pressed', { type: 'button-pressed', group, id, value, rect, sourceEvent });
    }

    cancel(group: ToolbarGroup) {
        this.listeners.dispatch('cancelled', { type: 'cancelled', group });
    }

    toggleButton<T extends ToolbarGroup>(
        group: T,
        id: string,
        options: { active?: boolean; enabled?: boolean; visible?: boolean; checked?: boolean }
    ) {
        const { active = false, enabled = true, visible = true, checked = false } = options;
        this.listeners.dispatch('button-toggled', {
            type: 'button-toggled',
            group,
            id,
            active,
            enabled,
            visible,
            checked,
        });
    }

    updateButton<T extends ToolbarGroup>(
        group: T,
        id: string,
        options: { label?: string; icon?: AgIconName; fill?: string; strokeWidth?: number }
    ) {
        this.listeners.dispatch('button-updated', { type: 'button-updated', group, id, ...options });
    }

    toggleGroup(caller: string, group: ToolbarGroup, options: { active?: boolean; visible?: boolean }) {
        const { active, visible } = options;
        this.listeners.dispatch('group-toggled', { type: 'group-toggled', caller, group, active, visible });
    }

    updateGroup<T extends ToolbarGroup>(group: T) {
        this.listeners.dispatch('group-updated', { type: 'group-updated', group });
    }

    changeFloatingAnchor(
        group: ToolbarGroup,
        anchor: { x: number; y: number; position?: 'right' | 'above' | 'above-left' }
    ) {
        this.listeners.dispatch('floating-anchor-changed', { type: 'floating-anchor-changed', group, anchor });
    }

    buttonMoved(group: ToolbarGroup, value: any, rect: BBox, groupRect: BBox) {
        this.listeners.dispatch('button-moved', { type: 'button-moved', group, value, rect, groupRect });
    }

    proxyGroupOptions<T extends ToolbarGroup>(caller: string, group: T, options: Partial<AgToolbarOptions[T]>) {
        this.listeners.dispatch('proxy-group-options', { type: 'proxy-group-options', caller, group, options });
    }
}
