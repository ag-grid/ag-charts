import { Group } from '../../scene/group';
import type { ZIndexSubOrder } from '../../scene/node';
import { Layers } from '../layers';
import type { SeriesGrouping } from './seriesStateManager';

export type SeriesConfig = {
    id: string;
    seriesGrouping?: SeriesGrouping;
    rootGroup: Group;
    highlightGroup: Group;
    type: string;
    getGroupZIndexSubOrder(
        type: 'data' | 'labels' | 'highlight' | 'path' | 'marker' | 'paths',
        subIndex?: number
    ): ZIndexSubOrder;
};

type LayerState = {
    seriesIds: string[];
    group: Group;
    highlight: Group;
};

const SERIES_THRESHOLD_FOR_AGGRESSIVE_LAYER_REDUCTION = 30;

export class SeriesLayerManager {
    private readonly rootGroup: Group;

    private readonly groups: {
        [type: string]: {
            [id: string]: LayerState;
        };
    } = {};
    private readonly series: { [id: string]: { layerState: LayerState; seriesConfig: SeriesConfig } } = {};

    private expectedSeriesCount = 1;
    private mode: 'normal' | 'aggressive-grouping' = 'normal';

    constructor(rootGroup: Group) {
        this.rootGroup = rootGroup;
    }

    public setSeriesCount(count: number) {
        this.expectedSeriesCount = count;
    }

    public requestGroup(seriesConfig: SeriesConfig) {
        const {
            id,
            type,
            rootGroup: seriesRootGroup,
            highlightGroup: seriesHighlightGroup,
            seriesGrouping,
        } = seriesConfig;
        const { groupIndex = id } = seriesGrouping ?? {};

        if (this.series[id] != null) {
            throw new Error(`AG Charts - series already has an allocated layer: ${this.series[id]}`);
        }

        // Re-evaluate mode only on first series addition - we can't swap strategy mid-setup.
        if (Object.keys(this.series).length === 0) {
            this.mode =
                this.expectedSeriesCount >= SERIES_THRESHOLD_FOR_AGGRESSIVE_LAYER_REDUCTION
                    ? 'aggressive-grouping'
                    : 'normal';
        }

        this.groups[type] ??= {};

        const lookupIndex = this.mode === 'normal' ? groupIndex : 0;
        let groupInfo = this.groups[type][lookupIndex];
        if (!groupInfo) {
            groupInfo = this.groups[type][lookupIndex] ??= {
                seriesIds: [],
                group: this.rootGroup.appendChild(
                    new Group({
                        name: `${type}-content`,
                        layer: true,
                        zIndex: Layers.SERIES_LAYER_ZINDEX,
                        zIndexSubOrder: seriesConfig.getGroupZIndexSubOrder('data'),
                    })
                ),
                highlight: this.rootGroup.appendChild(
                    new Group({
                        name: `${type}-highlight`,
                        layer: true,
                        zIndex: Layers.SERIES_LAYER_ZINDEX,
                        zIndexSubOrder: seriesConfig.getGroupZIndexSubOrder('highlight'),
                    })
                ),
            };
        }

        this.series[id] = { layerState: groupInfo, seriesConfig };

        groupInfo.seriesIds.push(id);
        groupInfo.group.appendChild(seriesRootGroup);
        groupInfo.highlight.appendChild(seriesHighlightGroup);
        return groupInfo.group;
    }

    public changeGroup(seriesConfig: SeriesConfig & { oldGrouping?: SeriesGrouping }) {
        const { id, seriesGrouping, type, rootGroup, highlightGroup, oldGrouping } = seriesConfig;
        const { groupIndex = id } = seriesGrouping ?? {};

        if (this.groups[type]?.[groupIndex]?.seriesIds.includes(id)) {
            // Already in the right group, nothing to do.
            return;
        }

        if (this.series[id] != null) {
            this.releaseGroup({ id, seriesGrouping: oldGrouping, type, rootGroup, highlightGroup });
        }
        this.requestGroup(seriesConfig);
    }

    public releaseGroup(seriesConfig: {
        id: string;
        seriesGrouping?: SeriesGrouping;
        highlightGroup: Group;
        rootGroup: Group;
        type: string;
    }) {
        const { id, seriesGrouping, rootGroup, highlightGroup, type } = seriesConfig;
        const { groupIndex = id } = seriesGrouping ?? {};

        if (this.series[id] == null) {
            throw new Error(`AG Charts - series doesn't have an allocated layer: ${id}`);
        }

        const lookupIndex = this.mode === 'normal' ? groupIndex : 0;
        const groupInfo = this.groups[type]?.[lookupIndex] ?? this.series[id]?.layerState;
        if (groupInfo) {
            groupInfo.seriesIds = groupInfo.seriesIds.filter((v) => v !== id);
            groupInfo.group.removeChild(rootGroup);
            groupInfo.highlight.removeChild(highlightGroup);
        }

        if (groupInfo?.seriesIds.length === 0) {
            // Last member of the layer, cleanup.
            this.rootGroup.removeChild(groupInfo.group);
            this.rootGroup.removeChild(groupInfo.highlight);
            delete this.groups[type][lookupIndex];
            delete this.groups[type][id];
        } else if (groupInfo?.seriesIds.length > 0) {
            // Update zIndexSubOrder to avoid it becoming stale as series are removed and re-added
            // with the same groupIndex, but are otherwise unrelated.
            const leadSeriesConfig = this.series[groupInfo?.seriesIds?.[0]]?.seriesConfig;
            groupInfo.group.zIndexSubOrder = leadSeriesConfig?.getGroupZIndexSubOrder('data');
            groupInfo.highlight.zIndexSubOrder = leadSeriesConfig?.getGroupZIndexSubOrder('highlight');
        }

        delete this.series[id];
    }

    public destroy() {
        for (const groups of Object.values(this.groups)) {
            for (const groupInfo of Object.values(groups)) {
                this.rootGroup.removeChild(groupInfo.group);
                this.rootGroup.removeChild(groupInfo.highlight);
            }
        }
        (this as any).groups = {};
        (this as any).series = {};
    }
}
