import type {
    CanvasPoint,
    DynamicContext,
    NormalisedChartCaptionOptions,
    NormalisedTextOrSegments,
} from 'ag-charts-core';
import {
    FONT_SIZE,
    callWithContext,
    createId,
    isArray,
    isSegmentTruncated,
    isTextTruncated,
    resolvePadding,
    toPlainText,
    toTextString,
    wrapText,
    wrapTextSegments,
} from 'ag-charts-core';
import type {
    AgCaptionClickEvent,
    AgCaptionTooltipOptions,
    AgCaptionTooltipRendererParams,
    AgCaptionType,
} from 'ag-charts-types';

import type { ChartRegistry } from '../module/moduleContext';
import { PointerEvents } from '../scene/node';
import { RotatableText } from '../scene/shape/text';
import { Transformable } from '../scene/transformable';
import type { BoundedTextWidget } from '../widget/boundedTextWidget';
import type { MouseWidgetEvent } from '../widget/widgetEvents';
import type { CaptionLike } from './captionLike';
import { expandLabelPadding } from './label';
import type { TooltipContent } from './tooltip/tooltipContent';

type CaptionNodeDatum = {
    visible: boolean;
    text: NormalisedTextOrSegments | undefined;
    textBaseline: string;
    x: number;
    y: number;
    rotationCenterX: number;
    rotationCenterY: number;
    rotation: number;
};

/** Build the font spec (FontOptions shape) consumed by text measurers from a caption's options. */
export function captionFont(opts: NormalisedChartCaptionOptions) {
    return {
        fontSize: opts.fontSize ?? FONT_SIZE.SMALLER,
        fontStyle: opts.fontStyle,
        fontWeight: opts.fontWeight,
        fontFamily: opts.fontFamily ?? 'sans-serif',
    };
}

/**
 * Chart-level caption (title/subtitle/footnote). Reads its option subtree from
 * `ctx.chartState.getValue('options', key)` and applies values to its scene node
 * during layout. Mirrors the Legend/Zoom pattern.
 *
 * For axis/series titles (which use `Caption`), the BaseProperties-based
 * `Caption` class continues to be used.
 */
export class ChartCaption implements CaptionLike {
    static readonly className = 'ChartCaption';

    readonly id = createId(this);
    readonly node = new RotatableText<CaptionNodeDatum>({ zIndex: 1 }).setProperties({
        visible: false,
        textAlign: 'center',
        pointerEvents: PointerEvents.None,
    });

    get opts(): NormalisedChartCaptionOptions {
        return this.ctx.chartState.getValue('options', this.key) ?? {};
    }

    // Members required by CaptionLike. Other field reads go through `opts` at the call site.
    get enabled(): boolean {
        return this.opts.enabled ?? false;
    }

    get text(): NormalisedTextOrSegments | undefined {
        return this.opts.text;
    }

    get padding(): number {
        return typeof this.opts.padding === 'number' ? this.opts.padding : 0;
    }

    /** Per-side padding reserved by the background box; zeros when no box is active. */
    get boxPadding() {
        return expandLabelPadding(this.opts);
    }

    /** Per-side padding that insets the caption text and shrinks its layout footprint, whether or not a box is drawn. */
    get contentPadding() {
        return resolvePadding(this.opts.padding);
    }

    private truncated = false;
    private proxyText?: BoundedTextWidget;
    private proxyTextListeners?: Array<() => void>;
    private lastProxyTextContent?: string;
    private lastProxyBBox?: { x: number; y: number; width: number; height: number };

    constructor(
        private readonly ctx: DynamicContext<ChartRegistry>,
        private readonly key: AgCaptionType
    ) {}

    /**
     * Apply the current options subtree to the scene node. Called from
     * `ChartCaptions.positionCaptions` before each layout so visible/text/font
     * properties land before render.
     */
    applyToNode() {
        const opts = this.opts;
        const { node } = this;
        node.visible = opts.enabled ?? false;
        node.text = opts.text;
        node.textAlign = opts.textAlign ?? 'center';
        node.fontStyle = opts.fontStyle;
        node.fontWeight = opts.fontWeight;
        node.fontSize = opts.fontSize ?? FONT_SIZE.SMALLER;
        node.fontFamily = opts.fontFamily ?? 'sans-serif';
        node.fill = opts.color;
        node.setBoxing({
            fill: opts.fill,
            fillOpacity: opts.fillOpacity,
            cornerRadius: opts.cornerRadius,
            padding: opts.padding,
            border: opts.border,
        });
    }

    registerInteraction(moduleCtx: DynamicContext<ChartRegistry>, where: 'beforebegin' | 'afterend') {
        return moduleCtx.eventsHub.on('layout:complete', () => this.updateA11yText(moduleCtx, where));
    }

    computeTextWrap(containerWidth: number, containerHeight: number) {
        const opts = this.opts;
        const wrapping = opts.wrapping ?? 'always';
        const truncate = opts.truncate ?? true;
        const { left, right, top, bottom } = this.contentPadding;
        const effectiveContainerWidth = truncate ? containerWidth : Infinity;
        const effectiveContainerHeight = truncate ? containerHeight : Infinity;
        const maxWidth = Math.min(opts.maxWidth ?? Infinity, effectiveContainerWidth) - (left + right);
        const maxHeight = opts.maxHeight ?? effectiveContainerHeight - (top + bottom);
        const options = { maxWidth, maxHeight, font: captionFont(opts), textWrap: wrapping };

        const text = opts.text;
        if (!Number.isFinite(maxWidth) && !Number.isFinite(maxHeight)) {
            this.node.text = text;
            return;
        }

        let wrappedText;
        if (isArray(text)) {
            wrappedText = wrapTextSegments(text, options);
            this.truncated = wrappedText.some(isSegmentTruncated);
        } else {
            wrappedText = wrapText(toTextString(text), options);
            this.truncated = isTextTruncated(wrappedText);
        }
        this.node.text = wrappedText;
    }

    private updateA11yText(moduleCtx: DynamicContext<ChartRegistry>, where: 'beforebegin' | 'afterend') {
        const { proxyInteractionService } = moduleCtx;
        if (!this.enabled || !this.text) {
            this.destroyProxyText();
            return;
        }

        const bbox = Transformable.toCanvas(this.node);
        if (!bbox) return;

        const { id: domManagerId } = this;
        if (this.proxyText == null) {
            this.proxyText = proxyInteractionService.createProxyElement({ type: 'text', domManagerId, where });
            this.proxyTextListeners = [
                this.proxyText.addListener('contextmenu', (ev) => this.handleContextMenu(moduleCtx, ev)),
                this.proxyText.addListener('click', (ev) => {
                    if (this.hasClickListener(moduleCtx)) this.handleClick(moduleCtx, ev);
                }),
                this.proxyText.addListener('dblclick', (ev) => {
                    if (this.hasClickListener(moduleCtx)) this.handleClick(moduleCtx, ev);
                }),
                this.proxyText.addListener('mousemove', (ev) => this.handleMouseMove(moduleCtx, ev)),
                this.proxyText.addListener('mouseleave', () => this.handleTooltipHide(moduleCtx)),
                this.proxyText.addListener('focus', () => this.handleFocus(moduleCtx)),
                this.proxyText.addListener('blur', () => this.handleTooltipHide(moduleCtx)),
            ];
        }

        // Signal interactivity only on captions that actually have a click listener.
        this.proxyText.setCursor(this.hasClickListener(moduleCtx) ? 'pointer' : undefined);

        const textContent = toPlainText(this.text);
        if (textContent !== this.lastProxyTextContent) {
            this.proxyText.textContent = textContent;
            this.lastProxyTextContent = textContent;
        }

        const { lastProxyBBox } = this;
        if (
            bbox.x !== lastProxyBBox?.x ||
            bbox.y !== lastProxyBBox?.y ||
            bbox.width !== lastProxyBBox?.width ||
            bbox.height !== lastProxyBBox?.height
        ) {
            this.proxyText.setBounds(bbox);
            this.lastProxyBBox = { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
        }
    }

    private getEffectiveTooltipVisible(): 'auto' | 'always' | 'never' {
        const tooltip: AgCaptionTooltipOptions = this.opts.tooltip ?? {};
        if (tooltip.visible != null) return tooltip.visible;
        return tooltip.text != null || tooltip.renderer != null ? 'always' : 'auto';
    }

    private getTooltipContent(moduleCtx: DynamicContext<ChartRegistry>): TooltipContent | undefined {
        const captionText = toPlainText(this.text);
        const tooltip: AgCaptionTooltipOptions = this.opts.tooltip ?? {};

        if (tooltip.renderer != null) {
            const params: AgCaptionTooltipRendererParams = { text: captionText };
            const result = callWithContext(moduleCtx.chartService, tooltip.renderer, params);
            if (result === '') return undefined;
            if (result != null) return { type: 'raw', rawHtmlString: toTextString(result) };
        }

        const displayText = tooltip.text ?? captionText;
        return { type: 'structured', title: displayText };
    }

    private showTooltip(moduleCtx: DynamicContext<ChartRegistry>, canvasX: number, canvasY: number) {
        if (!this.enabled) return;

        const effectiveVisible = this.getEffectiveTooltipVisible();
        if (effectiveVisible === 'never') return;
        if (effectiveVisible === 'auto' && !this.truncated) return;

        const content = this.getTooltipContent(moduleCtx);
        if (content == null) return;

        moduleCtx.tooltipManager.updateTooltip(this.id, { canvasX, canvasY, showArrow: false }, [content]);
    }

    private eventToCanvas(event: MouseWidgetEvent<'mousemove' | 'contextmenu'>): CanvasPoint {
        const bbox = Transformable.toCanvas(this.node);
        return {
            canvasX: event.sourceEvent.offsetX + bbox.x,
            canvasY: event.sourceEvent.offsetY + bbox.y,
        };
    }

    private handleMouseMove(moduleCtx: DynamicContext<ChartRegistry>, event?: MouseWidgetEvent<'mousemove'>) {
        if (event == null) return;
        const { canvasX, canvasY } = this.eventToCanvas(event);
        this.showTooltip(moduleCtx, canvasX, canvasY);
    }

    private handleFocus(moduleCtx: DynamicContext<ChartRegistry>) {
        const canvasPoint = Transformable.toCanvas(this.node).computeCenter();
        this.showTooltip(moduleCtx, canvasPoint.x, canvasPoint.y);
    }

    private handleTooltipHide(moduleCtx: DynamicContext<ChartRegistry>) {
        moduleCtx.tooltipManager.removeTooltip(this.id, undefined, true);
    }

    private handleContextMenu(moduleCtx: DynamicContext<ChartRegistry>, event: MouseWidgetEvent<'contextmenu'>) {
        const { canvasX, canvasY } = this.eventToCanvas(event);
        moduleCtx.contextMenuRegistry?.dispatchContext(
            'caption',
            { widgetEvent: event, canvasX, canvasY },
            { captionType: this.key, text: this.text ?? '' }
        );
    }

    /**
     * A caption is a click target only while a listener is registered for it, so that with none the
     * interaction falls through exactly as it did before (AG-17638).
     */
    private hasClickListener(moduleCtx: DynamicContext<ChartRegistry>): boolean {
        const captionListeners = this.opts.listeners;
        const chartListeners = moduleCtx.chartService.listeners;
        return (
            captionListeners?.click != null ||
            captionListeners?.doubleClick != null ||
            chartListeners.captionClick != null ||
            chartListeners.captionDoubleClick != null
        );
    }

    /**
     * Fires the caption's own `listeners` callbacks and their chart-level `captionClick` /
     * `captionDoubleClick` counterparts. Mirrors the caption context-menu dispatch above, reporting
     * the same `captionType` discriminator.
     */
    private handleClick(moduleCtx: DynamicContext<ChartRegistry>, event: MouseWidgetEvent<'click' | 'dblclick'>) {
        // Keyboard activation of caption listeners is out of scope for this feature (AG-17707).
        if (event.device === 'keyboard') return;

        const isDoubleClick = event.type === 'dblclick';
        const params = { event: event.sourceEvent, captionType: this.key, text: this.text ?? '' };

        const { listeners } = this.opts;
        const listener = isDoubleClick ? listeners?.doubleClick : listeners?.click;
        if (listener) {
            // Captions carry no `context` of their own, so `chart.context` is the only source.
            const apiEvent: Omit<AgCaptionClickEvent<'click' | 'doubleClick', never>, 'context'> = {
                type: isDoubleClick ? 'doubleClick' : 'click',
                ...params,
            };
            callWithContext(moduleCtx.chartService, listener, apiEvent);
        }

        // The chart-level listener fires alongside the caption-level one, as `seriesNodeClick` does.
        const chartEventType = isDoubleClick ? 'captionDoubleClick' : 'captionClick';
        moduleCtx.chartService.callListener({ type: chartEventType, ...params });
    }

    destroy() {
        this.destroyProxyText();
    }

    private destroyProxyText() {
        if (this.proxyText == null) return;

        for (const cleanup of this.proxyTextListeners ?? []) {
            cleanup();
        }
        this.proxyTextListeners = undefined;
        this.proxyText.destroy();
        this.proxyText = undefined;
        this.lastProxyTextContent = undefined;
        this.lastProxyBBox = undefined;
    }
}
