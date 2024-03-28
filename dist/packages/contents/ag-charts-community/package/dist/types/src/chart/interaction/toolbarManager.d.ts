import { BaseManager } from './baseManager';
type EventTypes = ToolbarVisibility | ToolbarButtonAdded | ToolbarButton;
type ToolbarVisibility = 'visibility';
type ToolbarButtonAdded = 'button-added';
type ToolbarButton = 'button-removed' | 'button-pressed';
export type ToolbarEvent<T extends EventTypes> = T extends ToolbarVisibility ? ToolbarVisibilityEvent : T extends ToolbarButtonAdded ? ToolbarButtonAddedEvent : ToolbarButtonEvent;
interface Event<T extends EventTypes> {
    type: T;
}
interface ToolbarVisibilityEvent extends Event<ToolbarVisibility> {
    visible: boolean;
}
interface ToolbarButtonAddedEvent extends Event<ToolbarButtonAdded> {
    id: string;
    options: ToolbarButtonOptions;
}
interface ToolbarButtonEvent extends Event<ToolbarButton> {
    id: string;
}
interface ToolbarButtonOptions {
    label: string;
}
export declare class ToolbarManager extends BaseManager<EventTypes, ToolbarEvent<EventTypes>> {
    private visible;
    toggleVisibility(callerId: string, visible?: boolean): void;
    addButton(id: string, options: {
        label: string;
    }): void;
    removeButton(id: string): void;
    pressButton(id: string): void;
}
export {};
