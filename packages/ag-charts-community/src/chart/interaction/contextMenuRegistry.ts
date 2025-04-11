import type { AgContextMenuItemLiteral, AgContextMenuItemShowOn } from 'ag-charts-types';

import { Listeners } from '../../util/listeners';
import type { ContextMenuCallback, ContextMenuEvent, ContextShowOnMap } from './contextMenuTypes';
import { ContextMenuBuiltins } from './contextMenuTypes';

export class ContextMenuRegistry {
    public readonly builtins = new ContextMenuBuiltins();
    private readonly hiddenActions: Set<string> = new Set();
    private readonly listeners: Listeners<'', (e: ContextMenuEvent) => void> = new Listeners();

    constructor() {
        this.setVisible('zoom-to-cursor', false);
        this.setVisible('pan-to-cursor', false);
        this.setVisible('reset-zoom', false);
    }

    public static check<T extends AgContextMenuItemShowOn>(
        showOn: T,
        event: ContextMenuEvent
    ): event is ContextMenuEvent<T> {
        return event.showOn == showOn;
    }

    public static checkCallback<T extends AgContextMenuItemShowOn>(
        desiredShowOn: T,
        showOn: AgContextMenuItemShowOn,
        _callback: ContextMenuCallback<AgContextMenuItemShowOn>
    ): _callback is ContextMenuCallback<T> {
        return desiredShowOn === showOn;
    }

    public dispatchContext<T extends AgContextMenuItemShowOn>(
        showOn: T,
        pointerEvent: { sourceEvent: MouseEvent; canvasX: number; canvasY: number },
        context: ContextShowOnMap[T]['context'],
        position?: { x: number; y: number }
    ) {
        const { sourceEvent } = pointerEvent;
        if (sourceEvent.defaultPrevented) {
            // AG-12894 'contextmenu' event bubbles, do not re-dispatch ContextMenuEvent if we're already draw own menu
            return;
        }
        const x = position?.x ?? pointerEvent.canvasX;
        const y = position?.y ?? pointerEvent.canvasY;
        const event: ContextMenuEvent = { showOn, x, y, context, sourceEvent };
        this.listeners.dispatch('', event);
    }

    public addListener(handler: (event: ContextMenuEvent) => void) {
        return this.listeners.addListener('', handler);
    }

    public isVisible(id: AgContextMenuItemLiteral): boolean {
        return !this.hiddenActions.has(id);
    }

    public setVisible(id: AgContextMenuItemLiteral, visible: boolean) {
        if (visible) {
            this.hiddenActions.delete(id);
        } else {
            this.hiddenActions.add(id);
        }
    }
}
