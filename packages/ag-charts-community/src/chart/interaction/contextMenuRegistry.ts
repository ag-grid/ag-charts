import { Listeners } from '../../util/listeners';
import { InteractionState, type PointerInteractionEvent } from './interactionManager';
import type { RegionManager } from './regionManager';

type ContextTypeMap = {
    all: { type: 'all'; pageX: number; pageY: number; sourceEvent: Event };
    legend: { type: 'legend'; pageX: number; pageY: number; sourceEvent: Event };
    series: { type: 'series'; pageX: number; pageY: number; sourceEvent: Event };
};

export type ContextType = keyof ContextTypeMap;
export type ContextMenuEvent<T extends ContextType = ContextType> = ContextTypeMap[T];

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
            const { pageX, pageY, sourceEvent } = event;
            event.consume();
            this.dispatchContext({ type: 'all', pageX, pageY, sourceEvent });
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

    public dispatchContext<T extends ContextType>(event: ContextMenuEvent<T>) {
        this.listeners.dispatch('', event);
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
