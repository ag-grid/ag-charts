import type { AgContextMenuOptions } from 'ag-charts-types';
import type { CategoryLegendDatum } from '../legendDatum';
import type { SeriesNodeDatum } from '../series/seriesTypes';
import { type PointerInteractionEvent } from './interactionManager';
import { type PreventableEvent } from './preventableEvent';
import type { RegionManager } from './regionManager';
type ContextTypeMap = {
    all: {};
    legend: {
        legendItem: CategoryLegendDatum | undefined;
    };
    series: {
        pickedNode: SeriesNodeDatum | undefined;
    };
    node: {
        pickedNode: SeriesNodeDatum | undefined;
    };
};
type ContextEventProperties<K extends ContextType = ContextType> = {
    type: K;
    x: number;
    y: number;
    context: ContextTypeMap[K];
    sourceEvent: Event;
};
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
export declare class ContextMenuRegistry {
    private readonly defaultActions;
    private readonly disabledActions;
    private readonly hiddenActions;
    private readonly listeners;
    private readonly destroyFns;
    constructor(regionManager: RegionManager);
    destroy(): void;
    private onContextMenu;
    private static toContextType;
    static check<T extends ContextType>(type: T, event: ContextMenuEvent): event is ContextMenuEvent<T>;
    static checkCallback<T extends ContextType>(desiredType: T, type: ContextType, _callback: ContextMenuCallback<ContextType>): _callback is ContextMenuCallback<T>;
    dispatchContext<T extends ContextType>(type: T, pointerEvent: PointerInteractionEvent<'contextmenu'>, context: ContextTypeMap[T]): void;
    addListener(handler: (event: ContextMenuEvent) => void): () => void;
    filterActions(type: ContextType): ContextMenuAction<ContextType>[];
    registerDefaultAction<T extends ContextType>(action: ContextMenuAction<T>): void;
    enableAction(actionId: string): void;
    disableAction(actionId: string): void;
    setActionVisiblity(actionId: string, visible: boolean): void;
    isDisabled(actionId: string): boolean;
}
export {};
