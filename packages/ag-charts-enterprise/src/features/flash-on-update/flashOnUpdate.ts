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
} from 'ag-charts-core';
import type { CssColor, DurationMs, Opacity } from 'ag-charts-types';

import type { AgFlashOnUpdateItem, AgFlashOnUpdateOptions } from './flashOnUpdateTypes';

const { Group, Rect, Selection, TranslatableGroup } = _ModuleSupport;

type AxisContext = ReturnType<_ModuleSupport.ModuleContext['axisManager']['getAxisContext']>[number];
type BandFlashDatum = { id: string; bounds: BoxBounds; phase: FlashAnimationPhase };
type FlashAnimationPhase = Extract<_ModuleSupport.AnimationPhase, 'remove' | 'update' | 'add'>;
const MAX_ANIMATION_DURATION_RATIO = 2;
const MIN_BAND_WIDTH = 1;

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
    private bandBounds?: Map<string, BoxBounds>;
    private previousBandBounds?: Map<string, BoxBounds>;
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
        this.chartFlashRect.x = 0;
        this.chartFlashRect.y = 0;
        this.chartFlashRect.width = chart.width;
        this.chartFlashRect.height = chart.height;

        this.seriesRect = series.rect.clone();
        this.bandGroup.translationX = Math.round(this.seriesRect.x);
        this.bandGroup.translationY = Math.round(this.seriesRect.y);
        this.bandGroup.setClipRect(this.seriesRect);

        const axisCtx = findPrimaryCategoryAxisContext(this.ctx);
        this.updateBandBounds(axisCtx);
    }

    private onDataModelDiff({ diff }: _ModuleSupport.DataModelDiffEvent): void {
        this.pendingDiffs.push(diff);
    }

    private onPreSceneRender({ apiUpdate }: _ModuleSupport.PreSceneRenderEvent): void {
        if (this.pendingDiffs.length === 0 || !this.enabled || !apiUpdate) {
            this.pendingDiffs.length = 0;
            return;
        }

        const categoryPhases = classifyDiffCategories(this.pendingDiffs);
        this.pendingDiffs.length = 0;

        if (categoryPhases.size === 0) return;

        this.stopFlash();

        if (this.item === 'chart') {
            this.flashChart();
        } else {
            this.flashCategoryBands(categoryPhases);
        }
    }

    private flashChart(): void {
        if (!this.chartFlashRect.width || !this.chartFlashRect.height) return;

        this.chartFlashRect.fill = this.color;
        this.chartFlashRect.fillOpacity = 0;
        this.animate([this.chartFlashRect], 'update');
    }

    private updateBandBounds(axisCtx: AxisContext | undefined): void {
        this.previousBandBounds = this.bandBounds;

        if (!axisCtx || !this.seriesRect || !_ModuleSupport.BandScale.is(axisCtx.scale)) {
            this.bandBounds = undefined;
            this.previousBandBounds = undefined;
            return;
        }

        this.bandBounds = this.buildBandBounds(axisCtx, this.seriesRect);
    }

    private buildBandBounds(axisCtx: AxisContext, seriesRect: _ModuleSupport.BBox): Map<string, BoxBounds> {
        const bounds = new Map<string, BoxBounds>();
        if (!_ModuleSupport.BandScale.is(axisCtx.scale)) return bounds;

        const isHorizontal = axisCtx.direction === ChartAxisDirection.X;
        for (const category of axisCtx.scale.bands) {
            const key = String(category);
            const band = axisCtx.measureBand(key)?.band;
            if (!band) continue;

            const [start, end] = band;
            const span = Math.max(end - start, MIN_BAND_WIDTH);

            bounds.set(
                key,
                isHorizontal
                    ? { x: start, y: 0, width: span, height: seriesRect.height }
                    : { x: 0, y: start, width: seriesRect.width, height: span }
            );
        }

        return bounds;
    }

    private flashCategoryBands(categoryPhases: Map<string, FlashAnimationPhase>): void {
        const data = this.createBandFlashData(categoryPhases);
        if (!data) return;

        this.updateSelection(data);
        this.animateBands();
    }

    private createBandFlashData(categoryPhases: Map<string, FlashAnimationPhase>): BandFlashDatum[] | undefined {
        const currentBounds = this.bandBounds;
        const previousBounds = this.previousBandBounds;
        if (!currentBounds && !previousBounds) {
            Logger.warnOnce(`flashOnUpdate item 'category' requires a category axis`);
            return;
        }

        const getBounds = (category: string, phase: FlashAnimationPhase) => {
            if (phase === 'add') return currentBounds?.get(category);
            if (phase === 'remove') return previousBounds?.get(category);
            return currentBounds?.get(category) ?? previousBounds?.get(category);
        };

        const data: BandFlashDatum[] = [];
        for (const [category, phase] of categoryPhases) {
            const bounds = getBounds(category, phase);
            if (bounds) data.push({ id: category, bounds, phase });
        }

        return data.length > 0 ? data : undefined;
    }

    private updateSelection(data: BandFlashDatum[]): void {
        this.bandSelection.update(data, undefined, (datum) => datum.id);

        this.bandSelection.each((rect, datum) => {
            rect.fill = this.color;
            rect.fillOpacity = 0;
            rect.x = datum.bounds.x;
            rect.y = datum.bounds.y;
            rect.width = datum.bounds.width;
            rect.height = datum.bounds.height;
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
        this.animate(updateRects, 'update', {
            onPlay: () => this.refreshRectBounds(updateRects),
        });
        this.animate(addRects, 'add', {
            onPlay: () => this.refreshRectBounds(addRects),
        });
    }

    private refreshRectBounds(rects: _ModuleSupport.Rect[]): void {
        if (!this.bandBounds) return;

        for (const rect of rects) {
            const updatedBounds = this.bandBounds.get(rect.datum.id);
            if (!updatedBounds) continue;

            rect.x = updatedBounds.x;
            rect.y = updatedBounds.y;
            rect.width = updatedBounds.width;
            rect.height = updatedBounds.height;
        }
    }

    private stopFlash(): void {
        this.ctx.animationManager.stopByAnimationGroupId(this.id);
    }

    private animate(
        rects: _ModuleSupport.Rect[],
        phase: _ModuleSupport.AnimationPhase,
        opts?: { onPlay?: () => void }
    ): void {
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
            phase,
            duration,
            ease,
            from: { fillOpacity: opacity },
            to: { fillOpacity: 0 },
            onPlay: () => {
                opts?.onPlay?.();
            },
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
