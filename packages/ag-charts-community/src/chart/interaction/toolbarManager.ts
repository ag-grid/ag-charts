import { StateTracker } from '../../util/stateTracker';
import { BaseManager } from './baseManager';

type EventTypes = ToolbarVisibility | ToolbarButtonAdded | ToolbarButton;
type ToolbarVisibility = 'visibility';
type ToolbarButtonAdded = 'button-added';
type ToolbarButton = 'button-removed' | 'button-pressed';

export type ToolbarEvent<T extends EventTypes> = T extends ToolbarVisibility
    ? ToolbarVisibilityEvent
    : T extends ToolbarButtonAdded
      ? ToolbarButtonAddedEvent
      : ToolbarButtonEvent;

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

export class ToolbarManager extends BaseManager<EventTypes, ToolbarEvent<EventTypes>> {
    private visible = new StateTracker(false);

    toggleVisibility(callerId: string, visible?: boolean) {
        const before = this.visible.stateValue();
        this.visible.set(callerId, visible);
        const after = this.visible.stateValue();

        if (after !== before) {
            this.listeners.dispatch('visibility', { type: 'visibility', visible: after ?? false });
        }
    }

    addButton(id: string, options: { label: string }) {
        this.listeners.dispatch('button-added', { type: 'button-added', id, options });
    }

    removeButton(id: string) {
        this.listeners.dispatch('button-removed', { type: 'button-removed', id });
    }

    pressButton(id: string) {
        this.listeners.dispatch('button-pressed', { type: 'button-pressed', id });
    }
}
