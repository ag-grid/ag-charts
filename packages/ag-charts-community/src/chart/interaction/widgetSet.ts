import type { AxisID, AxisWidget, DynamicContext, Widget } from 'ag-charts-core';
import { DragInterpreter, FocusIndicator, FocusSwapChain, LongTapInterpreter, NativeWidget } from 'ag-charts-core';

import type { ChartRegistry } from '../../module/moduleContext';

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

// TODO: Phase 3 "Common Widget Ancestor" - extend a real Widget base instead of the DOMManagerWidget fallback.
/**
 * Owns the series area's focus machinery: the FocusSwapChain that carries keyboard focus and screen-reader
 * announcements, and the FocusIndicator drawn over the focused item. Callers reach both through this widget.
 */
class SeriesAreaWidget extends DOMManagerWidget {
    public readonly swapChain: FocusSwapChain;
    public readonly focusIndicator?: FocusIndicator;

    constructor(ctx: DynamicContext<ChartRegistry>) {
        super(ctx.domManager.getParent('series-area'));

        this.swapChain = new FocusSwapChain(this.elem, 'img', ctx.localeManager.t('ariaInitSeriesArea'));

        if (ctx.domManager.mode === 'normal') {
            this.focusIndicator = new FocusIndicator(this.swapChain);
            this.focusIndicator.overrideFocusVisible(
                ctx.chartState.getValue('options', 'mode') === 'integrated' ? false : undefined
            );
        }
    }
}

export class WidgetSet {
    readonly seriesWidget: SeriesAreaWidget;
    readonly seriesBoundsWidget: Widget;
    readonly chartWidget: Widget;
    readonly containerWidget: Widget;
    readonly seriesDragInterpreter?: DragInterpreter;
    readonly longTapInterpreter?: LongTapInterpreter;
    private readonly ctx: DynamicContext<ChartRegistry>;
    private readonly axes: WeakMap<AxisID, WeakRef<AxisWidget>> = new Map();

    constructor(ctx: DynamicContext<ChartRegistry>, opts: { withDragInterpretation: boolean }) {
        this.ctx = ctx;
        const { domManager } = ctx;
        this.seriesWidget = new SeriesAreaWidget(ctx);
        this.seriesBoundsWidget = new DOMManagerWidget(domManager.getParent('series-area-bounds'));
        this.chartWidget = new DOMManagerWidget(domManager.getParent('canvas-proxy'));
        this.containerWidget = new DOMManagerWidget(domManager.getParent('canvas-container'));
        // TODO: AG−18361 Phase 3 "Common Widget Ancestor" - set these widgets as descendants of the DOM Manager root.
        this.containerWidget.setCanvasOrigin(domManager);
        this.seriesBoundsWidget.setCanvasOrigin(domManager);
        this.containerWidget.addChild(this.chartWidget);
        this.chartWidget.addChild(this.seriesWidget);
        if (opts.withDragInterpretation) {
            this.seriesDragInterpreter = new DragInterpreter(this.seriesWidget);
            // Not the container: that would also cover the overlay holding the popovers a long tap opens.
            this.longTapInterpreter = new LongTapInterpreter(this.chartWidget);
        }
    }

    destroy(): void {
        this.longTapInterpreter?.destroy();
        this.seriesDragInterpreter?.destroy();
        this.seriesWidget.destroy();
        this.seriesBoundsWidget.destroy();
        this.chartWidget.destroy();
        this.containerWidget.destroy();
    }

    acquireAxisWidget(axisId: AxisID): AxisWidget {
        const existingWidget: AxisWidget | undefined = this.axes.get(axisId)?.deref();
        // Ignore destroyed AxisWidget instances:
        if (existingWidget?.destroyListener !== undefined) {
            return existingWidget;
        }

        const newWidget: AxisWidget = this.ctx.proxyInteractionService.createProxyElement({
            type: 'axis',
            domManagerId: axisId,
            where: 'afterend',
            classList: ['ag-charts-proxy-axis'],
        });
        this.axes.set(axisId, new WeakRef(newWidget));
        return newWidget;
    }
}
