import { Group } from '../../scene/group';
import type { ZIndexSubOrder } from '../../scene/layersManager';
import type { SeriesGrouping } from './seriesStateManager';
export type SeriesGroupZIndexSubOrderType = 'data' | 'labels' | 'highlight' | 'path' | 'marker' | 'paths' | 'annotation';
export type SeriesConfig = {
    internalId: string;
    seriesGrouping?: SeriesGrouping;
    rootGroup: Group;
    highlightGroup: Group;
    annotationGroup: Group;
    type: string;
    getGroupZIndexSubOrder(type: SeriesGroupZIndexSubOrderType, subIndex?: number): ZIndexSubOrder;
};
export declare class SeriesLayerManager {
    private readonly seriesRoot;
    private readonly highlightRoot;
    private readonly annotationRoot;
    private readonly groups;
    private readonly series;
    private expectedSeriesCount;
    private mode;
    constructor(seriesRoot: Group, highlightRoot: Group, annotationRoot: Group);
    setSeriesCount(count: number): void;
    requestGroup(seriesConfig: SeriesConfig): Group;
    changeGroup(seriesConfig: SeriesConfig & {
        oldGrouping?: SeriesGrouping;
    }): void;
    releaseGroup(seriesConfig: {
        internalId: string;
        seriesGrouping?: SeriesGrouping;
        highlightGroup: Group;
        rootGroup: Group;
        annotationGroup: Group;
        type: string;
    }): void;
    private lookupIdx;
    destroy(): void;
}
