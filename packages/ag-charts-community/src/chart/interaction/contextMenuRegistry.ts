import type { CanvasPoint, DynamicContext, Writeable } from 'ag-charts-core';
import type { AgContextMenuItemLiteral, AgContextMenuItemShowOn } from 'ag-charts-types';

import type { ContextMenuEvent } from '../../core/eventsHub';
import type { ChartRegistry } from '../../module/moduleContext';
import type { MouseWidgetEvent } from '../../widget/widgetEvents';
import type { ContextMenuCallback, ContextMenuRegionContexts, ContextShowOnMap } from './contextMenuTypes';
import { ContextMenuBuiltins } from './contextMenuTypes';

export class ContextMenuRegistry {
    public readonly builtins = new ContextMenuBuiltins();
    private readonly hiddenActions: Set<string> = new Set();

    constructor(private readonly ctx: DynamicContext<ChartRegistry>) {
        this.toggle('zoom-to-cursor', 'hide');
        this.toggle('pan-to-cursor', 'hide');
        this.toggle('reset-zoom', 'hide');
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
        pointerEvent: { widgetEvent: MouseWidgetEvent<'contextmenu'> } & CanvasPoint,
        context: ContextShowOnMap[T]['context']
    ) {
        this.dispatchContextRegions(showOn, [showOn], { [showOn]: context }, pointerEvent, undefined);
    }

    public dispatchContextRegions(
        primaryShowOn: AgContextMenuItemShowOn,
        regions: readonly AgContextMenuItemShowOn[],
        contexts: ContextMenuRegionContexts,
        pointerEvent: { widgetEvent: MouseWidgetEvent<'contextmenu'> } & CanvasPoint,
        position?: CanvasPoint
    ) {
        const { widgetEvent } = pointerEvent;
        if (widgetEvent.sourceEvent.defaultPrevented) {
            // AG-12894 'contextmenu' event bubbles, do not re-dispatch ContextMenuEvent if we're already draw own menu
            return;
        }
        const event: Writeable<ContextMenuEvent> = {
            showOn: primaryShowOn,
            canvasX: position?.canvasX ?? pointerEvent.canvasX,
            canvasY: position?.canvasY ?? pointerEvent.canvasY,
            context: contexts[primaryShowOn],
            widgetEvent,
            regions,
            contexts,
        };
        this.ctx.eventsHub.emit('context-menu:setup', event);
        this.ctx.eventsHub.emit('context-menu:complete', event);
    }

    public isVisible(id: AgContextMenuItemLiteral): boolean {
        return !this.hiddenActions.has(id);
    }

    public toggle(id: AgContextMenuItemLiteral, action?: 'show' | 'hide') {
        action ??= this.isVisible(id) ? 'hide' : 'show';
        switch (action) {
            case 'show':
                this.hiddenActions.delete(id);
                break;
            case 'hide':
                this.hiddenActions.add(id);
                break;
        }
    }
}
