import { _ModuleSupport } from 'ag-charts-community';
import { AbstractModuleInstance, ChartAxisDirection, ZIndexMap, createId } from 'ag-charts-core';

import type { AxisSelectedBandOptions } from './axisSelectedBandTypes';

const { BBox, Rect, Selection, TranslatableGroup } = _ModuleSupport;

type AxisContext = _ModuleSupport.AxisContext;

/** Thickness below which a band would not show, however small the category. */
const MIN_BAND_THICKNESS_PX = 1;

const NO_CATEGORIES: ReadonlyMap<unknown, any> = new Map();

interface SelectedBand {
    /** The band's extent along the axis, relative to the series area. */
    readonly start: number;
    readonly end: number;
}

/**
 * Draws a background band across the series area behind each category with a selected datum in any series
 * bound to the axis, so every series' item of the category reads as one selected level.
 */
export class AxisSelectedBand extends AbstractModuleInstance {
    static readonly className = 'AxisSelectedBand';
    readonly id = createId(this);

    private options: AxisSelectedBandOptions | undefined;
    private readonly axisCtx: AxisContext;
    private seriesRect: _ModuleSupport.BBox | undefined;

    private readonly group = new TranslatableGroup({ name: 'axisSelectedBand', zIndex: ZIndexMap.AXIS_BAND_HIGHLIGHT });
    private readonly bandSelection: _ModuleSupport.Selection<SelectedBand, _ModuleSupport.Rect<SelectedBand>>;

    constructor(private readonly ctx: _ModuleSupport.ChartAxisRegistry<AxisContext>) {
        super();

        this.axisCtx = ctx.parent;
        this.bandSelection = Selection.select<_ModuleSupport.Rect<SelectedBand>>(
            this.group,
            () => new Rect({ name: 'axis-selected-band' })
        );

        this.cleanup.register(
            ctx.scene.attachNode(this.group),
            // A selection change always requests a layout, so the bands follow it through this event.
            ctx.eventsHub.on('layout:complete', ({ series }) => {
                this.seriesRect = series.rect.clone();
                this.redraw();
            })
        );
    }

    applyOptions(options: AxisSelectedBandOptions) {
        this.options = options;
        this.redraw();
    }

    onAxisUpdate() {
        this.redraw();
    }

    private redraw() {
        const { options, seriesRect } = this;
        if (!options?.enabled || seriesRect == null || seriesRect.width <= 0 || seriesRect.height <= 0) {
            this.hide();
            return;
        }

        const bands = this.collectBands();
        if (bands.length === 0) {
            this.hide();
            return;
        }

        // Categories lie along the axis' own direction; each band runs across the series area at right angles.
        const horizontal = this.axisCtx.direction === ChartAxisDirection.X;

        this.group.visible = true;
        this.group.translationX = Math.round(seriesRect.x);
        this.group.translationY = Math.round(seriesRect.y);
        // setClipRect takes canvas coordinates, so the clip follows the group's translation.
        this.group.setClipRect(
            new BBox(this.group.translationX, this.group.translationY, seriesRect.width, seriesRect.height)
        );

        this.bandSelection.update(bands);

        const { fill, fillOpacity = 1, stroke, strokeWidth = 0, lineDash } = options;
        this.bandSelection.each((rect, band) => {
            // Theme references are resolved before options arrive.
            rect.fill = fill as string | undefined;
            rect.fillOpacity = fillOpacity;
            rect.stroke = stroke as string | undefined;
            rect.strokeWidth = strokeWidth;
            rect.lineDash = lineDash;

            const thickness = Math.max(band.end - band.start, MIN_BAND_THICKNESS_PX);
            rect.x = horizontal ? band.start : 0;
            rect.y = horizontal ? 0 : band.start;
            rect.width = horizontal ? thickness : seriesRect.width;
            rect.height = horizontal ? seriesRect.height : thickness;
        });
    }

    private hide() {
        // Runs on every layout, so do nothing once hidden.
        if (!this.group.visible) return;

        this.group.visible = false;
        this.bandSelection.update([]);
    }

    /** The categories in view that have a selected datum in a series bound to the axis, as bands. */
    private collectBands(): SelectedBand[] {
        const bands: SelectedBand[] = [];
        for (const category of this.selectedCategories().values()) {
            const band = this.axisCtx.measureBand(category)?.band;
            if (band == null) continue;

            // The axis clamps bands to its range, so a category outside the zoomed range collapses to its edge.
            const [start, end] = band;
            if (end <= start) continue;

            bands.push({ start, end });
        }
        return bands;
    }

    /** The distinct categories of the selected datums of the series bound to the axis. */
    private selectedCategories(): ReadonlyMap<unknown, any> {
        const service = this.ctx.dataSelectionService;
        if (service == null) return NO_CATEGORIES;

        const boundIds = this.axisCtx.seriesIds();
        // Allocated on the first selection found: this runs on every layout, and most have none.
        let categories: Map<unknown, any> | undefined;
        for (const series of this.ctx.chartService.series) {
            if (!boundIds.includes(series.id)) continue;

            const selection = service.getDataSetSelection(series);
            if (selection == null || selection.getSelectedCount() === 0) continue;

            const selected = selection.getSelection();
            // Every selected datum is found once this reaches zero, so the scan can stop short of the end.
            let remaining = selection.getSelectedCount();
            for (let datumIndex = 0; datumIndex < selected.length && remaining > 0; datumIndex++) {
                if (selected[datumIndex] !== 1) continue;

                remaining--;

                const category = series.getCategoryValue(datumIndex);
                if (category == null) continue;

                categories ??= new Map();
                // Dates are distinct objects for the same instant, so key by value.
                categories.set(category.valueOf(), category);
            }
        }
        return categories ?? NO_CATEGORIES;
    }
}
