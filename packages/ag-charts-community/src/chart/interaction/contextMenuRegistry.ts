import type { AgContextMenuOptions } from 'ag-charts-types';

import { DestroyFns, Destructible } from '../../util/destroy';
import { Listeners } from '../../util/listeners';
import type { CategoryLegendDatum } from '../legendDatum';
import type { SeriesNodeDatum } from '../series/seriesTypes';
import { InteractionState, type PointerInteractionEvent } from './interactionManager';
import { type PreventableEvent, buildPreventable } from './preventableEvent';
import type { RegionManager } from './regionManager';

type ContextTypeMap = {
    all: {};
    legend: { legendItem: CategoryLegendDatum | undefined };
    series: { pickedNode: SeriesNodeDatum | undefined };
    node: { pickedNode: SeriesNodeDatum | undefined };
};

type ContextEventProperties<K extends ContextType = ContextType> = {
    type: K;
    x: number;
    y: number;
    context: ContextTypeMap[K];
    sourceEvent: Event;
};

// Extract the TEvent types from the AgContextMenuOptions contract:
type ContextMenuActionEventMap = {
    all: Parameters<NonNullable<AgContextMenuOptions['extraActions']>[number]['action']>[0];
    legend: Parameters<NonNullable<AgContextMenuOptions['extraLegendItemActions']>[number]['action']>[0];
    series: Parameters<NonNullable<AgContextMenuOptions['extraSeriesActions']>[number]['action']>[0];
    node: Parameters<NonNullable<AgContextMenuOptions['extraNodeActions']>[number]['action']>[0];
};

export type ContextType = keyof ContextTypeMap;
export type ContextMenuEvent<K extends ContextType = ContextType> = ContextEventProperties<K> & PreventableEvent;

export type ContextMenuCallback<K extends ContextType> = {
    all: (params: ContextMenuActionEventMap['all']) => void;
    legend: (params: ContextMenuActionEventMap['legend']) => void;
    series: (params: ContextMenuActionEventMap['series']) => void;
    node: (params: ContextMenuActionEventMap['node']) => void;
}[K];

export type ContextMenuAction<K extends ContextType> = {
    id?: string;
    label: string;
    type: K;
    action: ContextMenuCallback<K>;
};

export class ContextMenuRegistry extends Destructible {
    private readonly defaultActions: Array<ContextMenuAction<ContextType>> = [];
    private readonly disabledActions: Set<string> = new Set();
    private readonly hiddenActions: Set<string> = new Set();
    private readonly listeners: Listeners<'', (e: ContextMenuEvent) => void> = new Listeners();
    private readonly destroyFns = new DestroyFns();

    public constructor(regionManager: RegionManager) {
        super();
        const { Default, ContextMenu } = InteractionState;
        this.destroyFns.push(
            regionManager.listenAll('contextmenu', (e) => this.onContextMenu(e), Default | ContextMenu)
        );
    }

    protected override destructor() {}

    private onContextMenu(event: PointerInteractionEvent<'contextmenu'> & { region: string }) {
        const type = ContextMenuRegistry.toContextType(event.region);
        if (type === 'all') {
            this.dispatchContext('all', event, {});
        }
    }

    private static toContextType(region: string): ContextType {
        if (region === 'legend' || region === 'series') {
            return region;
        }
        return 'all';
    }

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
        pointerEvent: PointerInteractionEvent<'contextmenu'>,
        context: ContextTypeMap[T],
        position?: { x: number; y: number }
    ) {
        const { sourceEvent } = pointerEvent;
        const x = position?.x ?? pointerEvent.offsetX;
        const y = position?.y ?? pointerEvent.offsetY;
        sourceEvent.stopPropagation();
        this.listeners.dispatch('', buildPreventable({ type, x, y, context, sourceEvent }));
    }

    public addListener(handler: (event: ContextMenuEvent) => void) {
        return this.listeners.addListener('', handler);
    }

    public filterActions(type: ContextType): ContextMenuAction<ContextType>[] {
        return this.defaultActions.filter((action) => {
            return action.id && !this.hiddenActions.has(action.id) && ['all', type].includes(action.type);
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

    public setActionVisiblity(actionId: string, visible: boolean) {
        if (visible) {
            this.hiddenActions.delete(actionId);
        } else {
            this.hiddenActions.add(actionId);
        }
    }

    public isDisabled(actionId: string): boolean {
        return this.disabledActions.has(actionId);
    }
}
