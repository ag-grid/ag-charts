import type { Writeable } from 'ag-charts-core';
import type { AgContextMenuItemLiteral, AgContextMenuItemShowOn } from 'ag-charts-types';

import { BaseManager } from '../../util/baseManager';
import type { MouseWidgetEvent } from '../../widget/widgetEvents';
import type { ContextMenuCallback, ContextMenuEvent, ContextMenuEventType, ContextShowOnMap } from './contextMenuTypes';
import { ContextMenuBuiltins } from './contextMenuTypes';

export class ContextMenuRegistry extends BaseManager<ContextMenuEventType, ContextMenuEvent> {
    public readonly builtins = new ContextMenuBuiltins();
    private readonly hiddenActions: Set<string> = new Set();

    constructor() {
        super();
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
        pointerEvent: { widgetEvent: MouseWidgetEvent<'contextmenu'>; canvasX: number; canvasY: number },
        context: ContextShowOnMap[T]['context'],
        position?: { x: number; y: number }
    ) {
        const { widgetEvent } = pointerEvent;
        if (widgetEvent.sourceEvent.defaultPrevented) {
            // AG-12894 'contextmenu' event bubbles, do not re-dispatch ContextMenuEvent if we're already draw own menu
            return;
        }
        const x = position?.x ?? pointerEvent.canvasX;
        const y = position?.y ?? pointerEvent.canvasY;

        const event: Writeable<ContextMenuEvent> = { type: 'context-setup', showOn, x, y, context, widgetEvent };
        this.listeners.dispatch('context-setup', event);

        event.type = 'context-complete';
        this.listeners.dispatch('context-complete', event);
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
