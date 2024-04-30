import type { AgToolbarOptions } from '../../options/chart/toolbarOptions';
import type { ToolbarGroup } from '../toolbar/toolbarTypes';
import { BaseManager } from './baseManager';
type EventTypes = ToolbarButtonPressed | ToolbarButtonToggled | ToolbarGroupToggled | ToolbarProxyGroupOptions;
type ToolbarButtonPressed = 'button-pressed';
type ToolbarButtonToggled = 'button-toggled';
type ToolbarGroupToggled = 'group-toggled';
type ToolbarProxyGroupOptions = 'proxy-group-options';
type ToolbarEvent = ToolbarButtonPressedEvent | ToolbarButtonToggledEvent | ToolbarGroupToggledEvent | ToolbarProxyGroupOptionsEvent;
type ToolbarEventButtonValue<T extends ToolbarGroup> = NonNullable<NonNullable<AgToolbarOptions[T]>['buttons']>[number]['value'];
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
export declare class ToolbarManager extends BaseManager<EventTypes, ToolbarEvent> {
    readonly element: HTMLElement;
    static isGroup<T extends ToolbarGroup>(group: T, event: ToolbarEvent): event is ToolbarButtonPressedEvent<ToolbarEventButtonValue<T>>;
    constructor(element: HTMLElement);
    pressButton(group: ToolbarGroup, value: any): void;
    toggleGroup(group: ToolbarGroup, visible: boolean): void;
    toggleButton<T extends ToolbarGroup>(group: T, value: ToolbarEventButtonValue<T>, enabled: boolean): void;
    proxyGroupOptions<T extends ToolbarGroup>(group: T, options: Partial<AgToolbarOptions[T]>): void;
}
export {};
