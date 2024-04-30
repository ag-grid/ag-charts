import type { ChartAxisDirection } from '../chartAxisDirection';
import type { ISeries } from '../series/seriesTypes';
import type { UpdateService } from '../updateService';
import { BaseManager } from './baseManager';
import type { HighlightManager } from './highlightManager';
import type { TooltipManager } from './tooltipManager';
import type { ZoomManager } from './zoomManager';
type GroupId = string | symbol;
/** Breaks circular dependencies which occur when importing ChartAxis. */
type AxisLike = {
    boundSeries: ISeries<any, any>[];
    direction: ChartAxisDirection;
    keys: string[];
    reverse?: boolean;
    nice: boolean;
    min?: number;
    max?: number;
};
/** Breaks circular dependencies which occur when importing Chart. */
type ChartLike = {
    id: string;
    axes: AxisLike[];
    series: ISeries<any, any>[];
    modulesManager: {
        getModule<R>(module: string): R | undefined;
    };
    ctx: {
        highlightManager: HighlightManager;
        tooltipManager: TooltipManager;
        updateService: UpdateService;
        zoomManager: ZoomManager;
    };
    waitForDataProcess(timeout?: number): Promise<void>;
};
export declare class SyncManager extends BaseManager {
    protected chart: ChartLike;
    static chartsGroups: Map<GroupId, Set<ChartLike>>;
    static DEFAULT_GROUP: symbol;
    constructor(chart: ChartLike);
    subscribe(groupId?: GroupId): this;
    unsubscribe(groupId?: GroupId): this;
    getChart(): ChartLike;
    getGroup(groupId?: GroupId): ChartLike[];
    getGroupSiblings(groupId?: GroupId): ChartLike[];
    private get;
}
export {};
