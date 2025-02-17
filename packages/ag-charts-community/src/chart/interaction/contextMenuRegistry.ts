import type { AgContextMenuOptions } from 'ag-charts-types';

import { Listeners } from '../../util/listeners';
import type { CategoryLegendDatum } from '../legend/legendDatum';
import type { ISeries, SeriesNodeDatum } from '../series/seriesTypes';

type ContextTypeMap = {
    all: object;
    legend: { legendItem: CategoryLegendDatum | undefined };
    'series-area': {
        pickedSeries: ISeries<any, any, any> | undefined;
        pickedNode: SeriesNodeDatum<unknown> | undefined;
    };
    node: { pickedSeries: ISeries<any, any, any> | undefined; pickedNode: SeriesNodeDatum<unknown> | undefined };
};

export type MouseEventWithPointerType = MouseEvent & Partial<Pick<PointerEvent, 'pointerType'>>;

export type ContextType = keyof ContextTypeMap;
export type ContextMenuEvent<K extends ContextType = ContextType> = {
    readonly type: K;
    readonly x: number;
    readonly y: number;
    readonly context: Readonly<ContextTypeMap[K]>;
    readonly sourceEvent: MouseEventWithPointerType;
};

// Extract the TEvent types from the AgContextMenuOptions contract:
type ContextMenuActionEventMap = {
    all: Parameters<NonNullable<AgContextMenuOptions['extraActions']>[number]['action']>[0];
    legend: Parameters<NonNullable<AgContextMenuOptions['extraLegendItemActions']>[number]['action']>[0];
    'series-area': Parameters<NonNullable<AgContextMenuOptions['extraSeriesAreaActions']>[number]['action']>[0];
    node: Parameters<NonNullable<AgContextMenuOptions['extraNodeActions']>[number]['action']>[0];
};

export type ContextMenuCallback<K extends ContextType> = {
    all: (params: ContextMenuActionEventMap['all']) => void;
    legend: (params: ContextMenuActionEventMap['legend']) => void;
    'series-area': (params: ContextMenuActionEventMap['series-area']) => void;
    node: (params: ContextMenuActionEventMap['node']) => void;
}[K];

export type ContextMenuAction<K extends ContextType> = {
    id?: string;
    label: string;
    type: K;
    action: ContextMenuCallback<K>;
    toggleEnabledOnShow?: (event: ContextMenuEvent) => boolean;
};

export class ContextMenuRegistry {
    private readonly defaultActions: Array<ContextMenuAction<ContextType>> = [];
    private readonly disabledActions: Set<string> = new Set();
    private readonly hiddenActions: Set<string> = new Set();
    private readonly listeners: Listeners<'', (e: ContextMenuEvent) => void> = new Listeners();

    public static check<T extends ContextType>(type: T, event: ContextMenuEvent): event is ContextMenuEvent<T> {
        return event.type === type;
    }

    public static checkCallback<T extends ContextType>(
        desiredType: T,
        type: ContextType,
        _callback: ContextMenuCallback<ContextType>
    ): _callback is ContextMenuCallback<T> {
        return desiredType === type;
    }

    public dispatchContext<T extends ContextType>(
        type: T,
        pointerEvent: { sourceEvent: MouseEvent; canvasX: number; canvasY: number },
        context: ContextTypeMap[T],
        position?: { x: number; y: number }
    ) {
        const { sourceEvent } = pointerEvent;
        const x = position?.x ?? pointerEvent.canvasX;
        const y = position?.y ?? pointerEvent.canvasY;
        sourceEvent.stopPropagation();
        const event: ContextMenuEvent = { type, x, y, context, sourceEvent };
        this.listeners.dispatch('', event);
    }

    public addListener(handler: (event: ContextMenuEvent) => void) {
        return this.listeners.addListener('', handler);
    }

    public filterActions(type: ContextType): ContextMenuAction<ContextType>[] {
        return this.defaultActions.filter((action) => {
            return action.id != null && !this.hiddenActions.has(action.id) && ['all', type].includes(action.type);
        });
    }

    public registerDefaultAction<T extends ContextType>(action: ContextMenuAction<T>): () => void {
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
