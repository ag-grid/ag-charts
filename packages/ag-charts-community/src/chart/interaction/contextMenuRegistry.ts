import type { AgContextMenuItem, AgContextMenuItemShowOn } from 'ag-charts-types';

import { Listeners } from '../../util/listeners';
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
        context: {
            pickedSeries: ISeries<any, any, any> | undefined;
            pickedNode: SeriesNodeDatum<unknown> | undefined;
        };
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

export type MouseEventWithPointerType = MouseEvent & Partial<Pick<PointerEvent, 'pointerType'>>;

export type ContextMenuEvent<K extends AgContextMenuItemShowOn = AgContextMenuItemShowOn> = {
    readonly type: K;
    readonly x: number;
    readonly y: number;
    readonly context: Readonly<ContextShowOnMap[K]['context']>;
    readonly sourceEvent: MouseEventWithPointerType;
};

export type ContextMenuCallback<K extends AgContextMenuItemShowOn> = ContextShowOnMap[K]['callback'];

export type ContextMenuAction<K extends AgContextMenuItemShowOn> = {
    id?: string;
    label: string;
    type: K;
    action: ContextMenuCallback<K>;
    toggleEnabledOnShow?: (event: ContextMenuEvent) => boolean;
};

export class ContextMenuRegistry {
    private readonly defaultActions: Array<ContextMenuAction<AgContextMenuItemShowOn>> = [];
    private readonly disabledActions: Set<string> = new Set();
    private readonly hiddenActions: Set<string> = new Set();
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

    public filterActions(type: AgContextMenuItemShowOn): ContextMenuAction<AgContextMenuItemShowOn>[] {
        return this.defaultActions.filter((action) => {
            return action.id != null && !this.hiddenActions.has(action.id) && ['always', type].includes(action.type);
        });
    }

    public registerDefaultAction<T extends AgContextMenuItemShowOn>(action: ContextMenuAction<T>): () => void;
    public registerDefaultAction(action: ContextMenuAction<AgContextMenuItemShowOn>): () => void {
        const didAdd = action.id != null && !this.defaultActions.some(({ id }) => id === action.id);

        if (didAdd) {
            this.defaultActions.push(action);
        }

        return () => {
            const index = didAdd ? this.defaultActions.findIndex(({ id }) => id === action.id) : -1;
            if (index !== -1) {
                this.defaultActions.splice(index, 1);
            }
        };
    }

    public enableAction(actionId: string) {
        this.disabledActions.delete(actionId);
    }

    public disableAction(actionId: string) {
        this.disabledActions.add(actionId);
    }

    public showAction(actionId: string) {
        this.hiddenActions.add(actionId);
    }

    public hideAction(actionId: string) {
        this.hiddenActions.delete(actionId);
    }

    public isDisabled(actionId: string): boolean {
        return this.disabledActions.has(actionId);
    }
}
