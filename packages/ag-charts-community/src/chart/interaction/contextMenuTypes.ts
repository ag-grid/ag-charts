import type { RequireOptional } from 'ag-charts-core';
import type {
    AgContextMenuItem,
    AgContextMenuItemAlways,
    AgContextMenuItemLegendItem,
    AgContextMenuItemSeriesArea,
    AgContextMenuItemShowOn,
} from 'ag-charts-types';

import type { MouseWidgetEvent } from '../../widget/widgetEvents';
import type { CategoryLegendDatum } from '../legend/legendDatum';
import type { ISeries, SeriesNodeDatum } from '../series/seriesTypes';

// Extract TEvent from `action?: (param: TEvent)` of the AgContextMenuItem contract:
type InferTEvent<T extends AgContextMenuItemShowOn> =
    Extract<AgContextMenuItem, { showOn?: T; action?: (...args: any[]) => any }> extends {
        action?: (event: infer E) => any;
    }
        ? E
        : never;
type ContextShowOnMapRule = {
    [K in AgContextMenuItemShowOn]: {
        event: InferTEvent<K>;
        callback: (param: InferTEvent<K>) => void;
    };
};
export interface ContextShowOnMap extends ContextShowOnMapRule {
    always: {
        event: InferTEvent<'always'>;
        callback: (param: InferTEvent<'always'>) => void;
        context: undefined;
    };
    'legend-item': {
        event: InferTEvent<'legend-item'>;
        callback: (param: InferTEvent<'legend-item'>) => void;
        context: { legendItem: CategoryLegendDatum | undefined };
    };
    'series-area': {
        event: InferTEvent<'series-area'>;
        callback: (param: InferTEvent<'series-area'>) => void;
        context: undefined;
    };
    'series-node': {
        event: InferTEvent<'series-node'>;
        callback: (param: InferTEvent<'series-node'>) => void;
        context: {
            pickedSeries: ISeries<any, any, any> | undefined;
            pickedNode: SeriesNodeDatum<unknown> | undefined;
        };
    };
}

export type ContextMenuEventType = 'context-setup' | 'context-complete';

export type ContextMenuEvent<K extends AgContextMenuItemShowOn = AgContextMenuItemShowOn> = {
    readonly type: ContextMenuEventType;
    readonly showOn: K;
    readonly x: number;
    readonly y: number;
    readonly context: Readonly<ContextShowOnMap[K]['context']>;
    readonly widgetEvent: MouseWidgetEvent<'contextmenu'> & { sourceEvent: Partial<Pick<PointerEvent, 'pointerType'>> };
};

export type ContextMenuCallback<K extends AgContextMenuItemShowOn> = ContextShowOnMap[K]['callback'];

/**
 * Merge a union of objects into one object with all the properties. This is just to check at compile-time that
 * ContextMenuItem implements all properties of AgContextMenuItem API contract.
 */
type MergeUnion<T, CanBeUndefined extends keyof T> = {
    [K in T extends any ? keyof T : never]: T extends { [P in K]?: infer V }
        ? K extends CanBeUndefined
            ? V | undefined
            : V
        : never;
};

/**
 * The type of `contextMenu.items[]` recursively references its own type, but our compile-time check only needs a depth
 * of 1. Therefore, limit this depth to 1:
 */
export type ContextMenuItemContractNonRecursive = Omit<
    MergeUnion<Extract<AgContextMenuItem, object>, 'action'>,
    'items'
>;
export type ContextMenuItemContract = ContextMenuItemContractNonRecursive & {
    items: ContextMenuItemContractNonRecursive[];
};

type BuiltinItemListKeys = 'defaults';

type ContextMenuBuiltinItemsRules = {
    readonly [K in Exclude<AgContextMenuItem, object | BuiltinItemListKeys>]: RequireOptional<AgContextMenuItem>;
};
type ContextMenuBuiltinItemListsRules = {
    readonly [K in BuiltinItemListKeys]: readonly (keyof ContextMenuBuiltinItemsRules)[];
};

class ContextMenuBuiltinItems implements ContextMenuBuiltinItemsRules {
    readonly download: RequireOptional<AgContextMenuItemAlways> = {
        type: 'action',
        showOn: 'always',
        label: 'contextMenuDownload',
        enabled: true,
        action: undefined,
        items: undefined,
    };
    readonly 'zoom-to-cursor': RequireOptional<AgContextMenuItemSeriesArea> = {
        type: 'action',
        showOn: 'series-area',
        label: 'contextMenuZoomToCursor',
        enabled: true,
        action: undefined,
        items: undefined,
    };
    readonly 'pan-to-cursor': RequireOptional<AgContextMenuItemSeriesArea> = {
        type: 'action',
        showOn: 'series-area',
        label: 'contextMenuPanToCursor',
        enabled: true,
        action: undefined,
        items: undefined,
    };
    readonly 'toggle-series-visibility': RequireOptional<AgContextMenuItemLegendItem> = {
        type: 'action',
        showOn: 'legend-item',
        label: 'contextMenuToggleSeriesVisibility',
        enabled: true,
        action: undefined,
        items: undefined,
    };
    readonly 'toggle-other-series': RequireOptional<AgContextMenuItemLegendItem> = {
        type: 'action',
        showOn: 'legend-item',
        label: 'contextMenuToggleOtherSeries',
        enabled: true,
        action: undefined,
        items: undefined,
    };
    readonly 'separator': RequireOptional<AgContextMenuItemAlways> = {
        type: 'separator',
        showOn: 'always',
        label: 'separator',
        enabled: true,
        action: undefined,
        items: undefined,
    };
}

class ContextMenuBuiltinItemLists implements ContextMenuBuiltinItemListsRules {
    readonly defaults: readonly (keyof ContextMenuBuiltinItemsRules)[] = [
        'download',
        'zoom-to-cursor',
        'pan-to-cursor',
        'toggle-series-visibility',
        'toggle-other-series',
    ];
}

export class ContextMenuBuiltins {
    readonly items = new ContextMenuBuiltinItems();
    readonly lists = new ContextMenuBuiltinItemLists();
}
