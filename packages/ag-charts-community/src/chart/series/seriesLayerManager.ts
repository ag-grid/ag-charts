import { Group } from '../../scene/group';
import type { ZIndexSubOrder } from '../../scene/layersManager';
import { clamp } from '../../util/number';
import { zIndexLayers } from '../zIndexLayers';
import type { SeriesGrouping } from './seriesStateManager';

export type SeriesGroupZIndexSubOrderType =
    | 'data'
    | 'labels'
    | 'highlight'
    | 'path'
    | 'marker'
    | 'paths'
    | 'annotation';

export type SeriesConfig = {
    internalId: string;
    seriesGrouping?: SeriesGrouping;
    rootGroup: Group;
    highlightGroup: Group;
    annotationGroup: Group;
    type: string;
    getGroupZIndexSubOrder(type: SeriesGroupZIndexSubOrderType, subIndex?: number): ZIndexSubOrder;
};

type LayerState = {
    type: string;
    id: string | number;
    seriesIds: string[];
    group: Group;
    highlight: Group;
    annotation: Group;
};

const SERIES_THRESHOLD_FOR_AGGRESSIVE_LAYER_REDUCTION = 30;

export class SeriesLayerManager {
    private readonly groups: {
        [type: string]: {
            [id: string]: LayerState;
        };
    } = {};
    private readonly series: { [id: string]: { layerState: LayerState; seriesConfig: SeriesConfig } } = {};

    private expectedSeriesCount = 1;
    private mode: 'normal' | 'aggressive-grouping' = 'normal';

    constructor(
        private readonly seriesRoot: Group,
        private readonly highlightRoot: Group,
        private readonly annotationRoot: Group
    ) {}

    public setSeriesCount(count: number) {
        this.expectedSeriesCount = count;
    }

    public requestGroup(seriesConfig: SeriesConfig) {
        const {
            internalId,
            type,
            rootGroup: seriesRootGroup,
            highlightGroup: seriesHighlightGroup,
            annotationGroup: seriesAnnotationGroup,
            seriesGrouping,
        } = seriesConfig;
        const { groupIndex = internalId } = seriesGrouping ?? {};

        if (this.series[internalId] != null) {
            throw new Error(`AG Charts - series already has an allocated layer: ${this.series[internalId]}`);
        }

        // Re-evaluate mode only on first series addition - we can't swap strategy mid-setup.
        if (Object.keys(this.series).length === 0) {
            this.mode =
                this.expectedSeriesCount >= SERIES_THRESHOLD_FOR_AGGRESSIVE_LAYER_REDUCTION
                    ? 'aggressive-grouping'
                    : 'normal';
        }

        this.groups[type] ??= {};

        const lookupIndex = this.lookupIdx(groupIndex);
        const groupInfo = (this.groups[type][lookupIndex] ??= {
            type,
            id: lookupIndex,
            seriesIds: [],
            group: this.seriesRoot.appendChild(
                new Group({
                    name: `${type}-content`,
                    layer: true,
                    zIndex: zIndexLayers.SERIES_LAYER,
                    zIndexSubOrder: seriesConfig.getGroupZIndexSubOrder('data'),
                })
            ),
            highlight: this.highlightRoot.appendChild(
                new Group({
                    name: `${type}-highlight`,
                    zIndex: zIndexLayers.SERIES_LAYER,
                    zIndexSubOrder: seriesConfig.getGroupZIndexSubOrder('highlight'),
                })
            ),
            annotation: this.annotationRoot.appendChild(
                new Group({
                    name: `${type}-annotation`,
                    zIndex: zIndexLayers.SERIES_LAYER,
                    zIndexSubOrder: seriesConfig.getGroupZIndexSubOrder('annotation'),
                })
            ),
        });

        this.series[internalId] = { layerState: groupInfo, seriesConfig };

        groupInfo.seriesIds.push(internalId);
        groupInfo.group.appendChild(seriesRootGroup);
        groupInfo.highlight.appendChild(seriesHighlightGroup);
        groupInfo.annotation.appendChild(seriesAnnotationGroup);
        return groupInfo.group;
    }

    public changeGroup(seriesConfig: SeriesConfig & { oldGrouping?: SeriesGrouping }) {
        const { internalId, seriesGrouping, type, rootGroup, highlightGroup, annotationGroup, oldGrouping } =
            seriesConfig;
        const { groupIndex = internalId } = seriesGrouping ?? {};

        if (this.groups[type]?.[groupIndex]?.seriesIds.includes(internalId)) {
            // Already in the right group, nothing to do.
            return;
        }

        if (this.series[internalId] != null) {
            this.releaseGroup({
                internalId,
                seriesGrouping: oldGrouping,
                type,
                rootGroup,
                highlightGroup,
                annotationGroup,
            });
        }
        this.requestGroup(seriesConfig);
    }

    public releaseGroup(seriesConfig: {
        internalId: string;
        seriesGrouping?: SeriesGrouping;
        highlightGroup: Group;
        rootGroup: Group;
        annotationGroup: Group;
        type: string;
    }) {
        const { internalId, rootGroup, highlightGroup, annotationGroup, type } = seriesConfig;

        if (this.series[internalId] == null) {
            throw new Error(`AG Charts - series doesn't have an allocated layer: ${internalId}`);
        }

        const groupInfo = this.series[internalId]?.layerState;
        if (groupInfo) {
            groupInfo.seriesIds = groupInfo.seriesIds.filter((v) => v !== internalId);
            groupInfo.group.removeChild(rootGroup);
            groupInfo.highlight.removeChild(highlightGroup);
            groupInfo.annotation.removeChild(annotationGroup);
        }

        if (groupInfo?.seriesIds.length === 0) {
            // Last member of the layer, cleanup.
            this.seriesRoot.removeChild(groupInfo.group);
            this.highlightRoot.removeChild(groupInfo.highlight);
            this.annotationRoot.removeChild(groupInfo.annotation);
            delete this.groups[groupInfo.type][groupInfo.id];
            delete this.groups[type][internalId];
        } else if (groupInfo?.seriesIds.length > 0) {
            // Update zIndexSubOrder to avoid it becoming stale as series are removed and re-added
            // with the same groupIndex, but are otherwise unrelated.
            const leadSeriesConfig = this.series[groupInfo?.seriesIds?.[0]]?.seriesConfig;
            groupInfo.group.zIndexSubOrder = leadSeriesConfig?.getGroupZIndexSubOrder('data');
            groupInfo.highlight.zIndexSubOrder = leadSeriesConfig?.getGroupZIndexSubOrder('highlight');
            groupInfo.annotation.zIndexSubOrder = leadSeriesConfig?.getGroupZIndexSubOrder('annotation');
        }

        delete this.series[internalId];
    }

    private lookupIdx(groupIndex: number | string) {
        if (this.mode === 'normal') {
            return groupIndex;
        }

        if (typeof groupIndex === 'string') {
            groupIndex = Number(groupIndex.split('-').at(-1));
            if (!groupIndex) {
                return 0;
            }
        }

        return Math.floor(
            clamp(0, groupIndex / this.expectedSeriesCount, 1) * SERIES_THRESHOLD_FOR_AGGRESSIVE_LAYER_REDUCTION
        );
    }

    public destroy() {
        for (const groups of Object.values(this.groups)) {
            for (const groupInfo of Object.values(groups)) {
                this.seriesRoot.removeChild(groupInfo.group);
                this.highlightRoot.removeChild(groupInfo.highlight);
                this.annotationRoot.removeChild(groupInfo.annotation);
            }
        }
        (this as any).groups = {};
        (this as any).series = {};
    }
}
