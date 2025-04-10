import type { RequireOptional } from 'ag-charts-core';
import type {
    AgContextMenuItem,
    AgContextMenuItemAlways,
    AgContextMenuItemLegendItem,
    AgContextMenuItemSeriesArea,
    AgContextMenuItemShowOn,
} from 'ag-charts-types';

import { Listeners } from '../../util/listeners';
import type { ContextMenuCallback, ContextMenuEvent, ContextShowOnMap } from './contextMenuTypes';

type BuiltinItemListKeys = 'defaults';
type BuiltinHideableKeys = 'toggle-series-visibility' | 'toggle-other-series';

type ContextMenuBuiltinItemsRules = {
    [K in Exclude<AgContextMenuItem, object | BuiltinItemListKeys>]: RequireOptional<AgContextMenuItem>;
};
type ContextMenuBuiltinItemListsRules = {
    [K in BuiltinItemListKeys]: RequireOptional<AgContextMenuItem>[];
};
class ContextMenuBuiltinItems implements ContextMenuBuiltinItemsRules {
    readonly download: RequireOptional<AgContextMenuItemAlways> = {
        type: 'action',
        showOn: 'always',
        label: 'contextMenuDownload',
        enable: true,
        iconUrl: undefined,
        action: undefined,
        items: undefined,
    };
    readonly 'zoom-to-cursor': RequireOptional<AgContextMenuItemSeriesArea> = {
        type: 'action',
        showOn: 'series-area',
        label: 'contextMenuZoomToCursor',
        enable: true,
        iconUrl: undefined,
        action: undefined,
        items: undefined,
    };
    readonly 'pan-to-cursor': RequireOptional<AgContextMenuItemSeriesArea> = {
        type: 'action',
        showOn: 'series-area',
        label: 'contextMenuPanToCursor',
        enable: true,
        iconUrl: undefined,
        action: undefined,
        items: undefined,
    };
    readonly 'reset-zoom': RequireOptional<AgContextMenuItemSeriesArea> = {
        type: 'action',
        showOn: 'series-area',
        label: 'contextMenuResetZoom',
        enable: true,
        iconUrl: undefined,
        action: undefined,
        items: undefined,
    };
    readonly 'toggle-series-visibility': RequireOptional<AgContextMenuItemLegendItem> = {
        type: 'action',
        showOn: 'legend-item',
        label: 'contextMenuToggleSeriesVisibility',
        enable: true,
        iconUrl: undefined,
        action: undefined,
        items: undefined,
    };
    readonly 'toggle-other-series': RequireOptional<AgContextMenuItemLegendItem> = {
        type: 'action',
        showOn: 'legend-item',
        label: 'contextMenuToggleOtherSeries',
        enable: true,
        iconUrl: undefined,
        action: undefined,
        items: undefined,
    };
    readonly 'separator': RequireOptional<AgContextMenuItemAlways> = {
        type: 'separator',
        showOn: 'always',
        label: 'separator',
        enable: true,
        iconUrl: undefined,
        action: undefined,
        items: undefined,
    };
}

class ContextMenuBuiltinItemLists implements ContextMenuBuiltinItemListsRules {
    readonly defaults: RequireOptional<Extract<AgContextMenuItem, object>>[] = [];
    constructor(items: ContextMenuBuiltinItems) {
        this.defaults = [
            items['download'],
            items['zoom-to-cursor'],
            items['pan-to-cursor'],
            items['toggle-series-visibility'],
            items['toggle-other-series'],
        ];
    }
}

class ContextMenuBuiltins {
    readonly items = new ContextMenuBuiltinItems();
    readonly lists = new ContextMenuBuiltinItemLists(this.items);
}

export class ContextMenuRegistry {
    public readonly builtins = new ContextMenuBuiltins();
    private readonly hiddenActions: Set<BuiltinHideableKeys> = new Set();
    private readonly listeners: Listeners<'', (e: ContextMenuEvent) => void> = new Listeners();

    public static check<T extends AgContextMenuItemShowOn>(
        type: T,
        event: ContextMenuEvent
    ): event is ContextMenuEvent<T> {
        return event.type === type;
    }

    public static checkCallback<T extends AgContextMenuItemShowOn>(
        desiredType: T,
        type: AgContextMenuItemShowOn,
        _callback: ContextMenuCallback<AgContextMenuItemShowOn>
    ): _callback is ContextMenuCallback<T> {
        return desiredType === type;
    }

    public dispatchContext<T extends AgContextMenuItemShowOn>(
        type: T,
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
        const event: ContextMenuEvent = { type, x, y, context, sourceEvent };
        this.listeners.dispatch('', event);
    }

    public addListener(handler: (event: ContextMenuEvent) => void) {
        return this.listeners.addListener('', handler);
    }

    public filterActions(type: AgContextMenuItemShowOn) {
        return Object.values(this.builtins.items).filter((action) => {
            return action.id != null && !this.hiddenActions.has(action.id) && ['always', type].includes(action.type);
        });
    }

    public setVisible(id: BuiltinHideableKeys, visible: boolean) {
        if (visible) {
            this.hiddenActions.delete(id);
        } else {
            this.hiddenActions.add(id);
        }
    }
}
