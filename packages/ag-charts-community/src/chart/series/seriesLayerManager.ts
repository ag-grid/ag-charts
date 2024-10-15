import { Group } from '../../scene/group';
import { Layer } from '../../scene/layer';
import { clamp } from '../../util/number';
import type { SeriesGrouping } from './seriesStateManager';
import { SeriesZIndexMap } from './seriesZIndexMap';

export interface SeriesConfig {
    internalId: string;
    seriesGrouping?: SeriesGrouping;
    contentGroup: Group;
    type: string;
}

type LayerState = {
    type: string;
    id: string | number;
    seriesIds: string[];
    group: Group;
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

    constructor(private readonly seriesRoot: Group) {}

    public setSeriesCount(count: number) {
        this.expectedSeriesCount = count;
    }

    public requestGroup(seriesConfig: SeriesConfig) {
        const { internalId, type, contentGroup: seriesContentGroup, seriesGrouping } = seriesConfig;
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
                new Layer({
                    name: `${type}-managed-layer`,
                    zIndex: seriesConfig.contentGroup.zIndex,
                })
            ),
        });

        this.series[internalId] = { layerState: groupInfo, seriesConfig };

        groupInfo.seriesIds.push(internalId);
        groupInfo.group.appendChild(seriesContentGroup);
        return groupInfo.group;
    }

    public changeGroup(seriesConfig: SeriesConfig & { oldGrouping?: SeriesGrouping }) {
        const { internalId, seriesGrouping, type, contentGroup, oldGrouping } = seriesConfig;
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
                contentGroup,
            });
        }
        this.requestGroup(seriesConfig);
    }

    public releaseGroup(seriesConfig: {
        internalId: string;
        seriesGrouping?: SeriesGrouping;
        contentGroup: Group;
        type: string;
    }) {
        const { internalId, contentGroup, type } = seriesConfig;

        if (this.series[internalId] == null) {
            throw new Error(`AG Charts - series doesn't have an allocated layer: ${internalId}`);
        }

        const groupInfo = this.series[internalId]?.layerState;
        if (groupInfo) {
            groupInfo.seriesIds = groupInfo.seriesIds.filter((v) => v !== internalId);
            groupInfo.group.removeChild(contentGroup);
        }

        if (groupInfo?.seriesIds.length === 0) {
            // Last member of the layer, cleanup.
            this.seriesRoot.removeChild(groupInfo.group);
            delete this.groups[groupInfo.type][groupInfo.id];
            delete this.groups[type][internalId];
        } else if (groupInfo?.seriesIds.length > 0) {
            // Update zIndexSubOrder to avoid it becoming stale as series are removed and re-added
            // with the same groupIndex, but are otherwise unrelated.
            const leadSeriesConfig = this.series[groupInfo?.seriesIds?.[0]]?.seriesConfig;
            if (leadSeriesConfig != null) {
                groupInfo.group.zIndex = leadSeriesConfig.contentGroup.zIndex;
            } else {
                groupInfo.group.zIndex = [SeriesZIndexMap.ANY_CONTENT];
            }
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
            }
        }
        (this as any).groups = {};
        (this as any).series = {};
    }
}
