import { Group, SeriesZIndexMap, clamp, compareZIndex } from 'ag-charts-core';

import type { SeriesGrouping } from '../../module/seriesGrouping';

interface SeriesConfig {
    internalId: string;
    seriesGrouping: SeriesGrouping | undefined;
    contentGroup: Group;
    declarationOrder: number;
    bringToFront(): boolean;
    raisedAtRest(): boolean;
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
    private readonly series = new Map<
        string,
        { layerState: LayerState; seriesConfig: SeriesConfig; bringToFront: boolean; raisedAtRest: boolean }
    >();

    private expectedSeriesCount = 1;
    private mode: 'normal' | 'aggressive-grouping' = 'normal';

    constructor(private readonly seriesRoot: Group) {}

    public setSeriesCount(count: number) {
        this.expectedSeriesCount = count;
    }

    private getGroupIndex(seriesConfig: SeriesConfig) {
        const { internalId, seriesGrouping } = seriesConfig;
        return seriesGrouping?.groupIndex ?? internalId;
    }

    private getGroupType(seriesConfig: SeriesConfig, bringToFront: boolean) {
        return bringToFront ? 'top' : seriesConfig.type;
    }

    private getLayerKey(seriesConfig: SeriesConfig, bringToFront: boolean) {
        return {
            type: this.getGroupType(seriesConfig, bringToFront),
            lookupIndex: this.lookupIdx(this.getGroupIndex(seriesConfig)),
        };
    }

    public requestGroup(seriesConfig: SeriesConfig) {
        const { internalId, contentGroup: seriesContentGroup } = seriesConfig;
        const bringToFront = seriesConfig.bringToFront();

        const seriesInfo = this.series.get(internalId);
        if (seriesInfo != null) {
            throw new Error(`AG Charts - series already has an allocated layer: ${JSON.stringify(seriesInfo)}`);
        }

        // Re-evaluate mode only on first series addition - we can't swap strategy mid-setup.
        if (this.series.size === 0) {
            this.mode =
                this.expectedSeriesCount >= SERIES_THRESHOLD_FOR_AGGRESSIVE_LAYER_REDUCTION
                    ? 'aggressive-grouping'
                    : 'normal';
        }

        const { type, lookupIndex } = this.getLayerKey(seriesConfig, bringToFront);
        let group = this.groups.get(type);
        if (group == null) {
            group = new Map<string, LayerState>();
            this.groups.set(type, group);
        }

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
                        // Set in updateLayerCompositing
                        renderToOffscreenCanvas: false,
                    })
                ),
            };
            group.set(lookupIndex, groupInfo);
        }

        const raisedAtRest = seriesConfig.raisedAtRest();
        this.series.set(internalId, { layerState: groupInfo, seriesConfig, bringToFront, raisedAtRest });

        groupInfo.seriesIds.push(internalId);
        groupInfo.group.appendChild(seriesContentGroup);

        return groupInfo.group;
    }

    public changeGroup(seriesConfig: SeriesConfig) {
        const { internalId, contentGroup } = seriesConfig;
        const bringToFront = seriesConfig.bringToFront();
        const { type, lookupIndex } = this.getLayerKey(seriesConfig, bringToFront);

        const oldGroup = this.series.get(internalId);
        const oldType = oldGroup ? this.getGroupType(oldGroup.seriesConfig, oldGroup.bringToFront) : undefined;

        const groupInfo = this.groups.get(type)?.get(lookupIndex);

        if (oldGroup != null && oldType === type && groupInfo?.seriesIds.includes(internalId) === true) {
            // Already in the right group: only the at-rest raise it reports can have changed.
            oldGroup.raisedAtRest = seriesConfig.raisedAtRest();
            return;
        }

        if (this.series.has(internalId)) {
            this._releaseGroup({ internalId, contentGroup, type: oldType! });
        }
        return this.requestGroup(seriesConfig);
    }

    public releaseGroup(seriesConfig: SeriesConfig) {
        const { internalId, contentGroup } = seriesConfig;
        const type = this.getGroupType(seriesConfig, seriesConfig.bringToFront());
        this._releaseGroup({ internalId, contentGroup, type });
    }

    private _releaseGroup(seriesConfig: { internalId: string; contentGroup: Group; type: string }) {
        const { internalId, contentGroup, type } = seriesConfig;

        if (!this.series.has(internalId)) {
            throw new Error(`AG Charts - series doesn't have an allocated layer: ${internalId}`);
        }

        const groupInfo = this.series.get(internalId)?.layerState;
        if (groupInfo) {
            groupInfo.seriesIds = groupInfo.seriesIds.filter((v) => v !== internalId);
            contentGroup.remove();
        }

        if (groupInfo?.seriesIds.length === 0) {
            // Last member of the layer, cleanup.
            groupInfo.group.remove();
            this.groups.get(groupInfo.type)?.delete(groupInfo.id);
            this.groups.get(type)?.delete(internalId);
        } else if (groupInfo != null && groupInfo.seriesIds.length > 0) {
            // Update zIndexSubOrder to avoid it becoming stale as series are removed and re-added
            // with the same groupIndex, but are otherwise unrelated.
            groupInfo.group.zIndex = this.getLowestSeriesZIndex(groupInfo.seriesIds);
        }

        this.series.delete(internalId);
    }

    public updateLayerCompositing() {
        for (const groups of this.groups.values()) {
            for (const groupInfo of groups.values()) {
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
                group.zIndex = this.getLowestSeriesZIndex(seriesIds);
            }
        }
    }

    /**
     * Each series' rank in the paint order with no highlight raising a series, keyed by internal id: the layers
     * last assigned, with a series raised only by a highlight in the layer it returns to, ordered as
     * `updateLayerCompositing` does. Higher is drawn over lower; series sharing a rank are drawn in an order that
     * is not known.
     */
    public atRestPaintOrder(): Map<string, number> {
        const layerZ = new Map<LayerState | string, number>();
        const entries: { internalId: string; layer: LayerState | string; layerZ: number; z: number }[] = [];
        for (const [internalId, { layerState, seriesConfig, bringToFront, raisedAtRest }] of this.series) {
            let layer: LayerState | string = layerState;
            if (bringToFront && !raisedAtRest) {
                const { type, lookupIndex } = this.getLayerKey(seriesConfig, false);
                layer = this.groups.get(type)?.get(lookupIndex) ?? internalId;
            }
            const z = raisedAtRest ? Number.MAX_VALUE : seriesConfig.declarationOrder;
            layerZ.set(layer, Math.min(layerZ.get(layer) ?? z, z));
            entries.push({ internalId, layer, layerZ: z, z });
        }
        for (const entry of entries) {
            entry.layerZ = layerZ.get(entry.layer) ?? entry.z;
        }
        entries.sort((a, b) => (a.layerZ === b.layerZ ? a.z - b.z : a.layerZ - b.layerZ));

        const ranks = new Map<string, number>();
        let rank = -1;
        let previous: (typeof entries)[number] | undefined;
        for (const entry of entries) {
            if (previous?.layerZ !== entry.layerZ || previous.z !== entry.z) rank++;
            ranks.set(entry.internalId, rank);
            previous = entry;
        }
        return ranks;
    }

    private lookupIdx(groupIndex: number | string) {
        if (this.mode === 'normal') {
            return groupIndex;
        }

        if (typeof groupIndex === 'string') {
            groupIndex = Number(groupIndex.split('-').at(-1));
            if (!Number.isFinite(groupIndex)) {
                return 0;
            }
        }

        return Math.floor(
            clamp(0, groupIndex / this.expectedSeriesCount, 1) * SERIES_THRESHOLD_FOR_AGGRESSIVE_LAYER_REDUCTION
        );
    }

    public destroy() {
        for (const groups of this.groups.values()) {
            for (const groupInfo of groups.values()) {
                groupInfo.group.remove();
            }
        }

        this.groups.clear();
        this.series.clear();
    }

    private getLowestSeriesZIndex(seriesIds: string[]) {
        let lowestSeriesZIndex = undefined;
        for (const seriesId of seriesIds) {
            const series = this.series.get(seriesId);
            const zIndex = series?.seriesConfig.contentGroup.zIndex ?? SeriesZIndexMap.ANY_CONTENT;
            if (lowestSeriesZIndex == null || zIndex == null) {
                lowestSeriesZIndex = zIndex;
                continue;
            }

            lowestSeriesZIndex = compareZIndex(lowestSeriesZIndex, zIndex) <= 0 ? lowestSeriesZIndex : zIndex;
        }

        return lowestSeriesZIndex ?? SeriesZIndexMap.ANY_CONTENT;
    }
}
