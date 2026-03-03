import { _ModuleSupport } from 'ag-charts-community';
import type { BoxBounds, ModuleInstance } from 'ag-charts-core';
import {
    BaseProperties,
    ChartAxisDirection,
    CleanupRegistry,
    Logger,
    Property,
    ZIndexMap,
    createId,
    easeOut,
} from 'ag-charts-core';
import type { CssColor, DurationMs, Opacity } from 'ag-charts-types';

import type { AgFlashOnUpdateItem, AgFlashOnUpdateOptions } from './flashOnUpdateTypes';

const { Group, Rect, Selection, TranslatableGroup } = _ModuleSupport;

type AxisContext = ReturnType<_ModuleSupport.ModuleContext['axisManager']['getAxisContext']>[number];
export type BandFlashDatum = {
    firstKey: string;
    lastKey: string;
    bounds: BoxBounds;
    prevBounds?: BoxBounds;
    phase: FlashAnimationPhase;
};
export type FlashAnimationPhase = Extract<_ModuleSupport.AnimationPhase, 'remove' | 'update' | 'add'>;
const MAX_ANIMATION_DURATION_RATIO = 2;
const MIN_BAND_RENDER_PX = 1;
const MERGE_BAND_THRESHOLD_PX = 2;
const MERGE_BAND_EPSILON = 1e-6;
const PHASE_ORDER: Record<FlashAnimationPhase, number> = { remove: 0, update: 1, add: 2 };

function classifyDiffCategories(diffs: _ModuleSupport.DataModelDiff[]): Map<string, FlashAnimationPhase> {
    const phases = new Map<string, FlashAnimationPhase>();
    for (const seriesDiff of diffs.flatMap((diff) => Object.values(diff))) {
        for (const key of seriesDiff.updated) if (!phases.has(key)) phases.set(key, 'update');
        for (const key of seriesDiff.moved) if (!phases.has(key)) phases.set(key, 'update');
        for (const key of seriesDiff.removed) phases.set(key, 'remove');
        for (const key of seriesDiff.added) phases.set(key, 'add');
    }
    return phases;
}

function findPrimaryCategoryAxisContext(ctx: _ModuleSupport.ModuleContext): AxisContext | undefined {
    for (const dir of [ChartAxisDirection.X, ChartAxisDirection.Y]) {
        for (const axisCtx of ctx.axisManager.getAxisContext(dir)) {
            if (_ModuleSupport.BandScale.is(axisCtx.scale)) {
                return axisCtx;
            }
        }
    }
}

export function shouldMergeBands(dataLength: number, axisSpan: number): boolean {
    return axisSpan > 0 && dataLength > 0 && axisSpan / dataLength < MERGE_BAND_THRESHOLD_PX;
}

function mergeBounds(a: BoxBounds, b: BoxBounds, startKey: 'x' | 'y', sizeKey: 'width' | 'height'): void {
    const start = Math.min(a[startKey], b[startKey]);
    const end = Math.max(a[startKey] + a[sizeKey], b[startKey] + b[sizeKey]);
    a[startKey] = start;
    a[sizeKey] = end - start;
}

export function mergeBands(data: BandFlashDatum[], isHorizontal: boolean, axisSpan: number): BandFlashDatum[] {
    if (data.length === 0) return data;

    if (!shouldMergeBands(data.length, axisSpan)) return data;

    const startKey = isHorizontal ? 'x' : 'y';
    const sizeKey = isHorizontal ? 'width' : 'height';

    const sorted = [...data].sort((a, b) => {
        const phaseOrder = PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase];
        return phaseOrder == 0 ? a.bounds[startKey] - b.bounds[startKey] : phaseOrder;
    });

    const result: BandFlashDatum[] = [sorted[0]];
    let merged = result[0];

    for (let i = 1; i < sorted.length; i++) {
        const next = sorted[i];
        const mergedEnd = merged.bounds[startKey] + merged.bounds[sizeKey];
        const canMerge = next.phase === merged.phase && next.bounds[startKey] <= mergedEnd + MERGE_BAND_EPSILON;

        if (canMerge) {
            mergeBounds(merged.bounds, next.bounds, startKey, sizeKey);
            merged.lastKey = next.lastKey;
            if (merged.prevBounds) {
                mergeBounds(merged.prevBounds, next.prevBounds!, startKey, sizeKey);
            }
        } else {
            result.push(next);
            merged = next;
        }
    }

    return result;
}

export class FlashOnUpdate extends BaseProperties implements ModuleInstance, AgFlashOnUpdateOptions {
    static readonly className = 'FlashOnUpdate';

    private readonly id = createId(this);

    @Property
    enabled: boolean = false;

    @Property
    item: AgFlashOnUpdateItem = 'chart';

    @Property
    color: CssColor = '#cfeeff';

    @Property
    opacity: Opacity = 1;

    @Property
    flashDuration?: DurationMs;

    @Property
    fadeDuration?: DurationMs;

    private readonly cleanup = new CleanupRegistry();
    private readonly flashGroup = new Group({ name: 'flash-on-update', zIndex: ZIndexMap.AXIS_BAND_HIGHLIGHT });
    private readonly chartFlashRect: _ModuleSupport.Rect;
    private readonly bandGroup: _ModuleSupport.TranslatableGroup;
    private readonly bandSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, BandFlashDatum>;
    private seriesRect?: _ModuleSupport.BBox;
    private axisCtx?: AxisContext;
    private previousBoundsCache?: Map<string, BoxBounds>;
    private readonly pendingDiffs: _ModuleSupport.DataModelDiff[] = [];

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.chartFlashRect = this.flashGroup.appendChild(new Rect({ name: 'chart-flash-on-update' }));
        this.chartFlashRect.fillOpacity = 0;

        this.bandGroup = this.flashGroup.appendChild(new TranslatableGroup({ name: 'bands-flash-on-update' }));
        this.bandSelection = Selection.select<_ModuleSupport.Rect, BandFlashDatum>(
            this.bandGroup,
            () => new Rect({ name: 'flash-on-update-band' })
        );

        this.cleanup.register(
            this.ctx.scene.attachNode(this.flashGroup),
            this.ctx.eventsHub.on('layout:complete', (event) => this.onLayoutComplete(event)),
            this.ctx.eventsHub.on('datamodel:diff', (event) => this.onDataModelDiff(event)),
            this.ctx.updateService.addListener('pre-scene-render', (event) => this.onPreSceneRender(event))
        );
    }

    destroy() {
        this.ctx.animationManager.stopByAnimationGroupId(this.id);
        this.cleanup.flush();
    }

    private onLayoutComplete({ chart, series }: _ModuleSupport.LayoutCompleteEvent): void {
        if (!this.enabled) return;

        this.chartFlashRect.x = 0;
        this.chartFlashRect.y = 0;
        this.chartFlashRect.width = chart.width;
        this.chartFlashRect.height = chart.height;

        this.seriesRect = series.rect.clone();
        this.bandGroup.translationX = Math.round(this.seriesRect.x);
        this.bandGroup.translationY = Math.round(this.seriesRect.y);
        this.bandGroup.setClipRect(this.seriesRect);

        this.axisCtx = findPrimaryCategoryAxisContext(this.ctx);
    }

    private onDataModelDiff({ diff }: _ModuleSupport.DataModelDiffEvent): void {
        if (!this.enabled) return;

        this.pendingDiffs.push(diff);

        if (this.item === 'category') {
            this.cachePreviousBounds(diff);
        }
    }

    private onPreSceneRender({ apiUpdate }: _ModuleSupport.PreSceneRenderEvent): void {
        const hasDiffs = this.pendingDiffs.length > 0;

        if (!this.enabled || !apiUpdate) {
            this.pendingDiffs.length = 0;
            return;
        }

        if (!hasDiffs) return;

        const hasChanged = this.pendingDiffs.some((diff) =>
            Object.values(diff).some((seriesDiff) => seriesDiff.changed)
        );

        const categoryPhases = hasChanged ? classifyDiffCategories(this.pendingDiffs) : undefined;
        this.pendingDiffs.length = 0;

        if (!hasChanged) return;

        this.stopFlash();

        const hasCategoryChanges = categoryPhases != null && categoryPhases.size > 0;
        if (this.item === 'category' && hasCategoryChanges) {
            this.flashCategoryBands(categoryPhases);
        } else {
            this.flashChart();
        }
    }

    private flashChart(): void {
        if (!this.chartFlashRect.width || !this.chartFlashRect.height) return;

        this.chartFlashRect.fill = this.color;
        this.chartFlashRect.fillOpacity = 0;
        this.animate([this.chartFlashRect], 'update');
    }

    private cachePreviousBounds(diff: _ModuleSupport.DataModelDiff): void {
        for (const seriesDiff of Object.values(diff)) {
            for (const key of [...seriesDiff.removed, ...seriesDiff.updated, ...seriesDiff.moved]) {
                const bounds = this.measureBandBounds(key);
                if (bounds) {
                    this.previousBoundsCache ??= new Map();
                    this.previousBoundsCache.set(key, bounds);
                }
            }
        }
    }

    private measureBandBounds(key: string): BoxBounds | undefined {
        if (!this.axisCtx || !this.seriesRect) return;

        const band = this.axisCtx.measureBand(key)?.band;
        if (!band) return;

        const [start, end] = band;
        const span = Math.max(end - start, MIN_BAND_RENDER_PX);
        const isHorizontal = this.axisCtx.direction === ChartAxisDirection.X;

        return isHorizontal
            ? { x: start, y: 0, width: span, height: this.seriesRect.height }
            : { x: 0, y: start, width: this.seriesRect.width, height: span };
    }

    private flashCategoryBands(categoryPhases: Map<string, FlashAnimationPhase>): void {
        const data = this.createBandFlashData(categoryPhases);
        if (!data) return;

        this.updateSelection(data);
        this.animateBands();
    }

    private createBandFlashData(categoryPhases: Map<string, FlashAnimationPhase>): BandFlashDatum[] | undefined {
        if (!this.axisCtx || !this.seriesRect) {
            Logger.warnOnce(`flashOnUpdate item 'category' requires a category axis`);
            return;
        }

        const { direction } = this.axisCtx;
        const scale = this.axisCtx.scale as _ModuleSupport.BandScale<string>;
        const isHorizontal = direction === ChartAxisDirection.X;
        const axisSpan = isHorizontal ? this.seriesRect.width : this.seriesRect.height;
        const data = this.measureBandsBatch(scale, categoryPhases, isHorizontal);

        this.previousBoundsCache = undefined;

        if (data.length === 0) return undefined;

        return mergeBands(data, isHorizontal, axisSpan);
    }

    private measureBandsBatch(
        scale: _ModuleSupport.BandScale<string>,
        categoryPhases: Map<string, FlashAnimationPhase>,
        isHorizontal: boolean
    ): BandFlashDatum[] {
        const bandwidth = scale.bandwidth ?? 0;
        const step = scale.step ?? 0;
        const offset = (step - bandwidth) / 2;
        const [r0, r1] = scale.range;
        const rMin = Math.min(r0, r1);
        const rMax = Math.max(r0, r1);
        const crossAxisSpan = (isHorizontal ? this.seriesRect?.height : this.seriesRect?.width) ?? 0;

        const data: BandFlashDatum[] = [];
        for (const [category, phase] of categoryPhases) {
            if (phase === 'remove') {
                const bounds = this.previousBoundsCache?.get(category);
                if (bounds) data.push({ firstKey: category, lastKey: category, bounds, phase });
                continue;
            }

            const position = scale.convert(category);
            const start = Math.max(position - offset, rMin);
            const end = Math.min(position + bandwidth + offset, rMax);
            const span = Math.max(end - start, MIN_BAND_RENDER_PX);
            const bounds: BoxBounds = isHorizontal
                ? { x: start, y: 0, width: span, height: crossAxisSpan }
                : { x: 0, y: start, width: crossAxisSpan, height: span };
            const prevBounds = this.previousBoundsCache?.get(category);
            data.push({ firstKey: category, lastKey: category, bounds, prevBounds, phase });
        }

        return data;
    }

    private updateSelection(data: BandFlashDatum[]): void {
        this.bandSelection.update(data);

        this.bandSelection.each((rect, datum) => {
            const b = datum.prevBounds ?? datum.bounds;
            rect.fill = this.color;
            rect.fillOpacity = 0;
            rect.x = b.x;
            rect.y = b.y;
            rect.width = b.width;
            rect.height = b.height;
        });
    }

    private animateBands(): void {
        const removeRects: _ModuleSupport.Rect[] = [];
        const updateRects: _ModuleSupport.Rect[] = [];
        const addRects: _ModuleSupport.Rect[] = [];

        for (const rect of this.bandSelection.nodes()) {
            if (rect.datum.phase === 'remove') removeRects.push(rect);
            else if (rect.datum.phase === 'add') addRects.push(rect);
            else updateRects.push(rect);
        }

        this.animate(removeRects, 'remove');
        this.animate(updateRects, 'update');
        this.animate(addRects, 'add');
    }

    private stopFlash(): void {
        this.ctx.animationManager.stopByAnimationGroupId(this.id);
    }

    private animate(rects: _ModuleSupport.Rect[], phase: _ModuleSupport.AnimationPhase): void {
        if (rects.length === 0) return;

        const { opacity } = this;
        const { animationManager } = this.ctx;
        const timing = this.getCustomTiming();
        const phaseDuration = _ModuleSupport.PHASE_METADATA[phase].animationDuration;
        const duration = timing ? timing.duration * phaseDuration : undefined;
        const ease = timing?.ease;

        animationManager.animate({
            id: `${this.id}_${phase}`,
            groupId: this.id,
            forceAnimation: true,
            phase,
            duration,
            ease,
            from: { fillOpacity: opacity },
            to: { fillOpacity: 0 },
            onUpdate: ({ fillOpacity }, preInit) => {
                if (preInit) return;
                for (const rect of rects) {
                    rect.fillOpacity = fillOpacity;
                }
            },
            onStop: () => {
                for (const rect of rects) {
                    rect.fillOpacity = 0;
                }
            },
        });

        if (phase === 'update') {
            animationManager.animate({
                id: `${this.id}_${phase}_position`,
                groupId: this.id,
                forceAnimation: true,
                phase,
                duration,
                ease: easeOut,
                from: { t: 0 },
                to: { t: 1 },
                onUpdate: ({ t }, preInit) => {
                    if (preInit) return;
                    for (const rect of rects) {
                        const from = rect.datum?.prevBounds;
                        if (from) {
                            const to = rect.datum.bounds;
                            rect.x = from.x + (to.x - from.x) * t;
                            rect.y = from.y + (to.y - from.y) * t;
                            rect.width = from.width + (to.width - from.width) * t;
                            rect.height = from.height + (to.height - from.height) * t;
                        }
                    }
                },
            });
        }
    }

    private getCustomTiming(): { duration: number; ease: (t: number) => number } | undefined {
        const { flashDuration, fadeDuration } = this;
        if (flashDuration == null && fadeDuration == null) return undefined;

        const { defaultDuration } = this.ctx.animationManager;
        const flash = flashDuration ?? 0;
        const fade = fadeDuration ?? 0;
        const total = flash + fade;
        if (total <= 0) return undefined;

        const flashProportion = flash / total;
        return {
            // express total ms as a proportion of the default animation duration, capped at 2x.
            duration: Math.min(total / defaultDuration, MAX_ANIMATION_DURATION_RATIO),
            ease:
                // if flash duration exceeds total, hold flash for the entire duration, otherwise hold flash then fade
                flashProportion >= 1
                    ? () => 0
                    : (t: number) => (t <= flashProportion ? 0 : (t - flashProportion) / (1 - flashProportion)),
        };
    }
}
