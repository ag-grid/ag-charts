import type { AxisID, BoxBounds, DynamicContext } from 'ag-charts-core';

import type { ChartRegistry } from '../../module/moduleContext';
import type { AxisWidget } from '../../widget/axisWidget';
import type { BoundedTextWidget } from '../../widget/boundedTextWidget';
import { NativeWidget } from '../../widget/nativeWidget';
import { type Widget } from '../../widget/widget';
import { DragInterpreter } from './dragInterpreter';

class DOMManagerWidget extends NativeWidget {
    constructor(elem: HTMLElement) {
        super(elem);
    }

    protected override addChildToDOM() {
        // Adding/removing elements from the DOM is managed by the DOMManager
    }
    protected override removeChildFromDOM() {
        // Adding/removing elements from the DOM is managed by the DOMManager
    }
}

type AxisEntry = {
    region?: AxisWidget;
    text?: BoundedTextWidget;
    textNested: boolean;
    regionBounds?: BoxBounds;
    titleBounds?: BoxBounds;
};

/**
 * Owns the per-axis proxy widgets exposed on the `widgets` service: the interaction region
 * (`AxisWidget`) and the axis title text (`BoundedTextWidget`). The title exists whenever the axis
 * has a caption; the region only while an interaction feature (zoom / scrollbar / context-menu)
 * requests one. When both are present the title is a descendant of the region so it is not occluded
 * by it; otherwise the title is attached standalone next to the series area, exactly as before.
 *
 * Lives in this file (rather than its own module) to avoid a circular dependency: `WidgetSet` needs
 * to construct it, but the `DynamicContext<ChartRegistry>` type it depends on resolves back through
 * `WidgetSet`.
 */
export class AxisWidgets {
    private static readonly TITLE_ID_SUFFIX = '__axis-title';

    private readonly entries = new Map<AxisID, AxisEntry>();

    constructor(private readonly ctx: DynamicContext<ChartRegistry>) {}

    /** The axis title text widget, created on first request. Callers configure content/bounds/listeners. */
    acquireTitle(axisId: AxisID): BoundedTextWidget {
        const entry = this.getEntry(axisId);
        if (!entry.text) {
            entry.text = this.ctx.proxyInteractionService.createProxyElement({
                type: 'text',
                domManagerId: this.titleId(axisId),
                where: 'afterend',
            });
            entry.textNested = false;
            if (entry.region) {
                this.nestTitle(axisId, entry);
            }
        }
        return entry.text;
    }

    releaseTitle(axisId: AxisID): void {
        const entry = this.entries.get(axisId);
        if (!entry?.text) return;
        if (entry.textNested && entry.region) {
            entry.region.removeChildWidget(entry.text);
        }
        entry.text.destroy();
        entry.text = undefined;
        entry.textNested = false;
        this.pruneEntry(axisId, entry);
    }

    /** The axis interaction region, created on first request. Callers set bounds/pointer-events/listeners. */
    acquireRegion(axisId: AxisID): AxisWidget {
        const entry = this.getEntry(axisId);
        if (!entry.region) {
            entry.region = this.ctx.proxyInteractionService.createProxyElement({
                type: 'axis',
                domManagerId: axisId,
                where: 'afterend',
                role: 'region',
            });
            if (entry.text && !entry.textNested) {
                this.nestTitle(axisId, entry);
            }
        }
        return entry.region;
    }

    releaseRegion(axisId: AxisID): void {
        const entry = this.entries.get(axisId);
        if (!entry?.region) return;
        if (entry.text && entry.textNested) {
            this.unnestTitle(axisId, entry);
        }
        entry.region.destroy();
        entry.region = undefined;
        this.pruneEntry(axisId, entry);
    }

    // Bounds must be routed through these setters (rather than the widgets' own `setBounds`) because
    // the axis title text lives in one of two coordinate systems depending on interactivity:
    //   - Non-interactive axis: there is no region, so the title is a standalone element in the
    //     canvas-proxy container and is positioned in canvas coordinates.
    //   - Interactive axis: the title is nested inside the region widget, whose bounds are a subset
    //     of the canvas bounds. A nested element is positioned relative to the region's origin, not
    //     the canvas, so the title's canvas bounds must be translated by the region origin.
    // The region bounds (from the interaction feature) and title bounds (from the caption) arrive
    // from independent `layout:complete` listeners in an unspecified order, so both are stored and
    // the title position is re-derived on every update — never depending on which arrived last.

    setRegionBounds(axisId: AxisID, bounds: BoxBounds): void {
        const entry = this.getEntry(axisId);
        entry.regionBounds = bounds;
        entry.region?.setBounds(bounds);
        this.applyTitleBounds(entry);
    }

    setTitleBounds(axisId: AxisID, bounds: BoxBounds): void {
        const entry = this.getEntry(axisId);
        entry.titleBounds = bounds;
        this.applyTitleBounds(entry);
    }

    destroy(): void {
        for (const entry of this.entries.values()) {
            entry.text?.destroy();
            entry.region?.destroy();
        }
        this.entries.clear();
    }

    private applyTitleBounds(entry: AxisEntry): void {
        const { text, titleBounds } = entry;
        if (!text || !titleBounds) return;

        if (entry.textNested && entry.regionBounds) {
            text.setBounds({
                x: titleBounds.x - entry.regionBounds.x,
                y: titleBounds.y - entry.regionBounds.y,
                width: titleBounds.width,
                height: titleBounds.height,
            });
        } else {
            text.setBounds(titleBounds);
        }
    }

    private titleId(axisId: AxisID): string {
        return `${axisId}${AxisWidgets.TITLE_ID_SUFFIX}`;
    }

    private getEntry(axisId: AxisID): AxisEntry {
        let entry = this.entries.get(axisId);
        if (!entry) {
            entry = { textNested: false };
            this.entries.set(axisId, entry);
        }
        return entry;
    }

    // Move the standalone title element out of the DOM manager and into the region widget. The
    // domManager entry must be cleared first, otherwise a later re-attach would be a no-op (addChild
    // is keyed by id and returns the existing element).
    private nestTitle(axisId: AxisID, entry: AxisEntry): void {
        if (!entry.region || !entry.text) return;
        this.ctx.domManager.removeChild('canvas-proxy', this.titleId(axisId));
        entry.region.addChild(entry.text);
        entry.textNested = true;
        this.applyTitleBounds(entry);
    }

    private unnestTitle(axisId: AxisID, entry: AxisEntry): void {
        if (!entry.region || !entry.text) return;
        entry.region.removeChildWidget(entry.text);
        this.ctx.domManager.addChild('canvas-proxy', this.titleId(axisId), entry.text.getElement(), {
            where: 'afterend',
            query: '.ag-charts-series-area',
        });
        entry.textNested = false;
        this.applyTitleBounds(entry);
    }

    private pruneEntry(axisId: AxisID, entry: AxisEntry): void {
        if (!entry.region && !entry.text) {
            this.entries.delete(axisId);
        }
    }
}

export class WidgetSet {
    readonly seriesWidget: Widget;
    readonly chartWidget: Widget;
    readonly containerWidget: Widget;
    readonly seriesDragInterpreter?: DragInterpreter;
    readonly axisWidgets: AxisWidgets;

    constructor(ctx: DynamicContext<ChartRegistry>, opts: { withDragInterpretation: boolean }) {
        const { domManager } = ctx;
        this.seriesWidget = new DOMManagerWidget(domManager.getParent('series-area'));
        this.chartWidget = new DOMManagerWidget(domManager.getParent('canvas-proxy'));
        this.containerWidget = new DOMManagerWidget(domManager.getParent('canvas-container'));
        this.containerWidget.addChild(this.chartWidget);
        this.chartWidget.addChild(this.seriesWidget);
        if (opts.withDragInterpretation) {
            this.seriesDragInterpreter = new DragInterpreter(this.seriesWidget);
        }
        this.axisWidgets = new AxisWidgets(ctx);
    }

    destroy(): void {
        this.axisWidgets.destroy();
        this.seriesDragInterpreter?.destroy();
        this.seriesWidget.destroy();
        this.chartWidget.destroy();
        this.containerWidget.destroy();
    }
}
