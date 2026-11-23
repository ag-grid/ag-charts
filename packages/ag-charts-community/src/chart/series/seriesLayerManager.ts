import { Group, SeriesZIndexMap, type ZIndex, clamp, compareZIndex } from 'ag-charts-core';

import type { SeriesGrouping } from '../../module/seriesGrouping';

interface SeriesConfig {
    id: string;
    internalId: string;
    seriesGrouping: SeriesGrouping | undefined;
    contentGroup: Group;
    bringToFront(): boolean;
    raisedAtRest(): boolean;
    atRestZIndex(): ZIndex;
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
    private paintOrder?: Map<string, number>;

    constructor(private readonly seriesRoot: Group) {}

    public setSeriesCount(count: number) {
        this.expectedSeriesCount = count;
        this.paintOrder = undefined;
    }

    private getGroupIndex(seriesConfig: SeriesConfig) {
        const { internalId, seriesGrouping } = seriesConfig;
        return seriesGrouping?.groupIndex ?? internalId;
    }

    private getGroupType(seriesConfig: SeriesConfig, bringToFront: boolean) {
        return bringToFront ? 'top' : seriesConfig.type;
    }

    public requestGroup(seriesConfig: SeriesConfig) {
        const { internalId, contentGroup: seriesContentGroup } = seriesConfig;
        const bringToFront = seriesConfig.bringToFront();
        const type = this.getGroupType(seriesConfig, bringToFront);
        const groupIndex = this.getGroupIndex(seriesConfig);

        const seriesInfo = this.series.get(internalId);
        if (seriesInfo != null) {
            throw new Error(`AG Charts - series already has an allocated layer: ${JSON.stringify(seriesInfo)}`);
        }
        this.paintOrder = undefined;

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
        const type = this.getGroupType(seriesConfig, bringToFront);

        const oldGroup = this.series.get(internalId);
        const oldType = oldGroup ? this.getGroupType(oldGroup.seriesConfig, oldGroup.bringToFront) : undefined;
        // Called whenever the series' order or raise changes, either of which can reorder it.
        this.paintOrder = undefined;

        const groupIndex = this.getGroupIndex(seriesConfig);
        const lookupIndex = this.lookupIdx(groupIndex);

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
        this.paintOrder = undefined;

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

    /** Each series' rank in the draw order the scene last applied, ignoring highlight raises, keyed by series id. */
    public atRestPaintOrder(): ReadonlyMap<string, number> {
        if (this.paintOrder != null) return this.paintOrder;

        type Layer = { lowestZIndex: ZIndex; serial: number };
        type Entry = { id: string; layer: Layer; zIndex: ZIndex; serial: number };
        const layers = new Map<LayerState | string, Layer>();
        const entries: Entry[] = [];
        for (const [internalId, { layerState, seriesConfig, bringToFront, raisedAtRest }] of this.series) {
            let layer: LayerState | string = layerState;
            if (bringToFront && !raisedAtRest) {
                // A highlight raise: the layer it returns to, or a new one drawn after the rest when that is gone.
                const lookupIndex = this.lookupIdx(this.getGroupIndex(seriesConfig));
                layer = this.groups.get(seriesConfig.type)?.get(lookupIndex) ?? internalId;
            }
            const zIndex = seriesConfig.atRestZIndex();
            let entryLayer = layers.get(layer);
            if (entryLayer == null) {
                const serial = typeof layer === 'string' ? Infinity : layer.group.serialNumber;
                entryLayer = { lowestZIndex: zIndex, serial };
                layers.set(layer, entryLayer);
            } else if (compareZIndex(zIndex, entryLayer.lowestZIndex) < 0) {
                entryLayer.lowestZIndex = zIndex;
            }
            entries.push({
                id: seriesConfig.id,
                layer: entryLayer,
                zIndex,
                serial: seriesConfig.contentGroup.serialNumber,
            });
        }
        // As `Group` draws children: layers by their lowest member's z-index, then members; ties by serial number.
        entries.sort((a, b) => {
            const byLayer = compareZIndex(a.layer.lowestZIndex, b.layer.lowestZIndex);
            if (byLayer !== 0) return byLayer;
            if (a.layer.serial !== b.layer.serial) return a.layer.serial < b.layer.serial ? -1 : 1;
            const byZIndex = compareZIndex(a.zIndex, b.zIndex);
            return byZIndex === 0 ? a.serial - b.serial : byZIndex;
        });

        this.paintOrder = new Map(entries.map(({ id }, rank) => [id, rank]));
        return this.paintOrder;
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
