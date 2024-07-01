import type { AgToolbarOptions } from 'ag-charts-types';
import type { BBox } from '../../scene/bbox';
import { BaseManager } from '../baseManager';
import type { DOMManager } from '../dom/domManager';
import { type ToolbarGroup } from '../toolbar/toolbarTypes';
type EventTypes = 'button-pressed' | 'button-toggled' | 'button-moved' | 'cancelled' | 'floating-anchor-changed' | 'group-toggled' | 'proxy-group-options';
type ToolbarEvent = ToolbarButtonPressedEvent | ToolbarButtonToggledEvent | ToolbarButtonMovedEvent | ToolbarCancelledEvent | ToolbarFloatingAnchorChangedEvent | ToolbarGroupToggledEvent | ToolbarProxyGroupOptionsEvent;
type ToolbarEventButtonValue<T extends ToolbarGroup> = NonNullable<NonNullable<AgToolbarOptions[T]>['buttons']>[number]['value'];
interface Event<T extends EventTypes> {
    type: T;
    group: ToolbarGroup;
}
export interface ToolbarGroupToggledEvent extends Event<'group-toggled'> {
    caller: string;
    visible: boolean;
}
export interface ToolbarCancelledEvent extends Event<'cancelled'> {
}
export interface ToolbarFloatingAnchorChangedEvent extends Event<'floating-anchor-changed'> {
    anchor: {
        x: number;
        y: number;
        position?: 'right' | 'above';
    };
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
export interface ToolbarButtonMovedEvent<T = any> extends Event<'button-moved'> {
    value: T;
    rect: BBox;
}
export interface ToolbarProxyGroupOptionsEvent extends Event<'proxy-group-options'> {
    caller: string;
    options: Partial<NonNullable<AgToolbarOptions[ToolbarGroup]>>;
}
export declare class ToolbarManager extends BaseManager<EventTypes, ToolbarEvent> {
    static isGroup<T extends ToolbarGroup>(group: T, event: ToolbarEvent): event is ToolbarButtonPressedEvent<ToolbarEventButtonValue<T>>;
    static isChildElement(domManager: DOMManager, element: HTMLElement): boolean;
    pressButton(group: ToolbarGroup, value: any): void;
    cancel(group: ToolbarGroup): void;
    toggleButton<T extends ToolbarGroup>(group: T, value: ToolbarEventButtonValue<T>, options: {
        active?: boolean;
        enabled?: boolean;
        visible?: boolean;
    }): void;
    toggleGroup(caller: string, group: ToolbarGroup, visible: boolean): void;
    changeFloatingAnchor(group: ToolbarGroup, anchor: {
        x: number;
        y: number;
        position?: 'right' | 'above';
    }): void;
    buttonMoved(group: ToolbarGroup, value: any, rect: BBox): void;
    proxyGroupOptions<T extends ToolbarGroup>(caller: string, group: T, options: Partial<AgToolbarOptions[T]>): void;
}
export {};
