import { Listeners } from '../../util/listeners';
import type { CategoryLegendDatum } from '../legendDatum';
import type { SeriesNodeDatum } from '../series/seriesTypes';
import { type ConsumableEvent, buildConsumable } from './consumableEvent';
import { InteractionState, type PointerInteractionEvent } from './interactionManager';
import type { RegionManager } from './regionManager';

type ContextTypeMap = {
    all: {};
    legend: { legendItem: CategoryLegendDatum | undefined };
    series: { pickedNode: SeriesNodeDatum | undefined };
};

type ContextEventProperties<K extends ContextType = ContextType> = {
    type: K;
    context: ContextTypeMap[K];
    sourceEvent: PointerInteractionEvent<'contextmenu'>;
};

export type ContextType = keyof ContextTypeMap;
export type ContextMenuEvent<K extends ContextType = ContextType> = ContextEventProperties<K> & ConsumableEvent;

export type ContextMenuAction = {
    id?: string;
    label: string;
    type: ContextType;
    action: (params: ContextMenuActionParams) => void;
};

export type ContextMenuActionParams = {
    datum?: any;
    itemId?: string;
    seriesId?: string;
    event: MouseEvent;
};

export class ContextMenuRegistry {
    private readonly defaultActions: Array<ContextMenuAction> = [];
    private readonly disabledActions: Set<string> = new Set();
    private readonly hiddenActions: Set<string> = new Set();
    private readonly listeners: Listeners<'', (e: ContextMenuEvent) => void> = new Listeners();
    private readonly destroyFns: (() => void)[];

    public constructor(regionManager: RegionManager) {
        const { Default, ContextMenu } = InteractionState;
        this.destroyFns = [regionManager.listenAll('contextmenu', (e) => this.onContextMenu(e), Default | ContextMenu)];
    }

    public destroy() {
        this.destroyFns.forEach((d) => d());
    }

    private onContextMenu(event: PointerInteractionEvent<'contextmenu'>) {
        const type = ContextMenuRegistry.toContextType(event.region);
        if (type === 'all') {
            this.dispatchContext('all', event, {});
        }
    }

    private static toContextType(region: string | undefined): ContextType {
        if (region === 'legend' || region === 'series') {
            return region;
        }
        return 'all';
    }

    public static check<T extends ContextType>(type: T, event: ContextMenuEvent): event is ContextMenuEvent<T> {
        return event.type === type;
    }

    public dispatchContext<T extends ContextType>(
        type: T,
        sourceEvent: PointerInteractionEvent<'contextmenu'>,
        context: ContextTypeMap[T]
    ) {
        this.listeners.dispatch('', this.buildConsumable({ type, context, sourceEvent }));
    }

    private buildConsumable<T extends ContextType>(nonconsumble: ContextEventProperties<T>): ContextMenuEvent<T> {
        return buildConsumable(nonconsumble);
    }

    public addListener(handler: (event: ContextMenuEvent) => void) {
        return this.listeners.addListener('', handler);
    }

    public filterActions(type: ContextType): ContextMenuAction[] {
        return this.defaultActions.filter((action) => {
            return action.id && !this.hiddenActions.has(action.id) && ['all', type].includes(action.type);
        });
    }

    public registerDefaultAction(action: ContextMenuAction) {
        if (action.id && this.defaultActions.find(({ id }) => id === action.id)) {
            return;
        }
        this.defaultActions.push(action);
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
