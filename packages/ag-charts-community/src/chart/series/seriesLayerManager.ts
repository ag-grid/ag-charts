import { Group } from '../../scene/group';
import { type ZIndex, compareZIndex } from '../../scene/zIndex';
import { clamp } from '../../util/number';
import type { SeriesGrouping } from './seriesStateManager';
import { SeriesZIndexMap } from './seriesZIndexMap';

export interface SeriesConfig {
    internalId: string;
    seriesGrouping?: SeriesGrouping;
    contentGroup: Group;
    renderToOffscreenCanvas(): boolean;
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
    private readonly groups = new Map<string, Map<string | number, LayerState>>();
    private readonly series = new Map<string, { layerState: LayerState; seriesConfig: SeriesConfig }>();

    private expectedSeriesCount = 1;
    private mode: 'normal' | 'aggressive-grouping' = 'normal';

    constructor(private readonly seriesRoot: Group) {}

    public setSeriesCount(count: number) {
        this.expectedSeriesCount = count;
    }

    public requestGroup(seriesConfig: SeriesConfig) {
        const { internalId, type, contentGroup: seriesContentGroup, seriesGrouping } = seriesConfig;
        const { groupIndex = internalId } = seriesGrouping ?? {};

        const seriesInfo = this.series.get(internalId);
        if (seriesInfo != null) {
            throw new Error(`AG Charts - series already has an allocated layer: ${seriesInfo}`);
        }

        // Re-evaluate mode only on first series addition - we can't swap strategy mid-setup.
        if (this.series.size === 0) {
            this.mode =
                this.expectedSeriesCount >= SERIES_THRESHOLD_FOR_AGGRESSIVE_LAYER_REDUCTION
                    ? 'aggressive-grouping'
                    : 'normal';
        }

        let group = this.groups.get(type);
        if (group == null) {
            group = new Map<string, LayerState>();
            this.groups.set(type, group);
        }

        const lookupIndex = this.lookupIdx(groupIndex);

        let groupInfo = group.get(lookupIndex);
        if (groupInfo == null) {
            groupInfo = {
                type,
                id: lookupIndex,
                seriesIds: [],
                group: this.seriesRoot.appendChild(
                    new Group({
                        name: `${seriesConfig.contentGroup.name ?? type}-managed-layer`,
                        zIndex: seriesConfig.contentGroup.zIndex,
                        renderToOffscreenCanvas: true,
                    })
                ),
            };
            group.set(lookupIndex, groupInfo);
        }

        this.series.set(internalId, { layerState: groupInfo, seriesConfig });

        groupInfo.seriesIds.push(internalId);
        groupInfo.group.appendChild(seriesContentGroup);
        return groupInfo.group;
    }

    public changeGroup(seriesConfig: SeriesConfig & { oldGrouping?: SeriesGrouping }) {
        const { internalId, seriesGrouping, type, contentGroup, oldGrouping } = seriesConfig;
        const { groupIndex = internalId } = seriesGrouping ?? {};

        if (this.groups.get(type)?.get(groupIndex)?.seriesIds.includes(internalId)) {
            // Already in the right group, nothing to do.
            return;
        }

        if (this.series.has(internalId)) {
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

        if (!this.series.has(internalId)) {
            throw new Error(`AG Charts - series doesn't have an allocated layer: ${internalId}`);
        }

        const groupInfo = this.series.get(internalId)?.layerState;
        if (groupInfo) {
            groupInfo.seriesIds = groupInfo.seriesIds.filter((v) => v !== internalId);
            groupInfo.group.removeChild(contentGroup);
        }

        if (groupInfo?.seriesIds.length === 0) {
            // Last member of the layer, cleanup.
            this.seriesRoot.removeChild(groupInfo.group);
            this.groups.get(groupInfo.type)?.delete(groupInfo.id);
            this.groups.get(type)?.delete(internalId);
        } else if (groupInfo != null && groupInfo.seriesIds.length > 0) {
            // Update zIndexSubOrder to avoid it becoming stale as series are removed and re-added
            // with the same groupIndex, but are otherwise unrelated.
            const lowestSeriesZIndex = groupInfo.seriesIds.reduce<ZIndex | undefined>((currentLowest, seriesId) => {
                const series = this.series.get(seriesId);
                const zIndex = series?.seriesConfig.contentGroup.zIndex;
                if (currentLowest == null || zIndex == null) return zIndex;

                return compareZIndex(currentLowest, zIndex) <= 0 ? currentLowest : zIndex;
            }, undefined);
            groupInfo.group.zIndex = lowestSeriesZIndex ?? SeriesZIndexMap.ANY_CONTENT;
        }

        this.series.delete(internalId);
    }

    public updateLayerCompositing() {
        this.groups.forEach((groups) => {
            groups.forEach((groupInfo) => {
                const { group, seriesIds } = groupInfo;

                let renderToOffscreenCanvas: boolean;
                if (seriesIds.length === 0) {
                    renderToOffscreenCanvas = false;
                } else if (seriesIds.length > 1) {
                    renderToOffscreenCanvas = true;
                } else {
                    const series = this.series.get(seriesIds[0]);
                    renderToOffscreenCanvas = series?.seriesConfig.renderToOffscreenCanvas() === true;
                }

                group.renderToOffscreenCanvas = renderToOffscreenCanvas;
            });
        });
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
        this.groups.forEach((groups) => {
            groups.forEach((groupInfo) => {
                this.seriesRoot.removeChild(groupInfo.group);
            });
        });

        (this as any).groups = new Map();
        (this as any).series = new Map();
    }
}
