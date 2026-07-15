import type { AxisID, DynamicContext, NormalisedTextOrSegments } from 'ag-charts-core';
import {
    BaseProperties,
    FONT_SIZE,
    Property,
    ProxyPropertyOnWrite,
    callWithContext,
    createId,
    isArray,
    isSegmentTruncated,
    isTextTruncated,
    toPlainText,
    toTextString,
    wrapText,
    wrapTextSegments,
} from 'ag-charts-core';
import type {
    AgCaptionTooltipRendererParams,
    FontStyle,
    FontWeight,
    Renderer,
    TextAlign,
    TextWrap,
} from 'ag-charts-types';

import type { ChartRegistry } from '../module/moduleContext';
import { PointerEvents } from '../scene/node';
import { RotatableText } from '../scene/shape/text';
import { Transformable } from '../scene/transformable';
import type { BoundedTextWidget } from '../widget/boundedTextWidget';
import type { MouseWidgetEvent } from '../widget/widgetEvents';
import type { CaptionLike } from './captionLike';
import type { TooltipContent } from './tooltip/tooltipContent';

type CaptionNodeDatum = {
    visible: boolean;
    text: NormalisedTextOrSegments | undefined;
    textAlign: string;
    textBaseline: string;
    x: number;
    y: number;
    rotationCenterX: number;
    rotationCenterY: number;
    rotation: number;
};

class CaptionTooltipProperties extends BaseProperties {
    @Property
    visible?: 'auto' | 'always' | 'never';

    @Property
    text?: string;

    @Property
    renderer?: Renderer<AgCaptionTooltipRendererParams, never>;
}

export class Caption extends BaseProperties implements CaptionLike {
    static readonly className = 'Caption';

    readonly id = createId(this);
    readonly node = new RotatableText<CaptionNodeDatum>({ zIndex: 1 }).setProperties({
        textAlign: 'center',
        pointerEvents: PointerEvents.None,
    });

    @Property
    @ProxyPropertyOnWrite('node', 'visible')
    enabled: boolean = false;

    @Property
    @ProxyPropertyOnWrite('node')
    text?: NormalisedTextOrSegments;

    @Property
    @ProxyPropertyOnWrite('node')
    textAlign: TextAlign = 'center';

    @Property
    @ProxyPropertyOnWrite('node')
    fontStyle?: FontStyle;

    @Property
    @ProxyPropertyOnWrite('node')
    fontWeight?: FontWeight;

    @Property
    @ProxyPropertyOnWrite('node')
    fontSize: number = FONT_SIZE.SMALLER;

    @Property
    @ProxyPropertyOnWrite('node')
    fontFamily: string = 'sans-serif';

    @Property
    @ProxyPropertyOnWrite('node', 'fill')
    color?: string;

    @Property
    spacing?: number;

    @Property
    maxWidth?: number;

    @Property
    maxHeight?: number;

    @Property
    wrapping: TextWrap = 'always';

    @Property
    truncate: boolean = true;

    @Property
    padding: number = 0;

    @Property
    layoutStyle: 'block' | 'overlay' = 'block';

    @Property
    readonly tooltip = new CaptionTooltipProperties();

    private truncated = false;
    private proxyText?: BoundedTextWidget;
    private proxyTextListeners?: Array<() => void>;
    private lastProxyTextContent?: string;
    private lastProxyBBox?: { x: number; y: number; width: number; height: number };
    private a11yContext?: { moduleCtx: DynamicContext<ChartRegistry>; axisId: AxisID };

    registerInteraction(moduleCtx: DynamicContext<ChartRegistry>, axisId: AxisID) {
        this.a11yContext = { moduleCtx, axisId };
        return moduleCtx.eventsHub.on('layout:complete', () => this.updateA11yText(moduleCtx, axisId));
    }

    computeTextWrap(containerWidth: number, containerHeight: number) {
        const { text, padding, wrapping, truncate } = this;
        const effectiveContainerWidth = truncate ? containerWidth : Infinity;
        const effectiveContainerHeight = truncate ? containerHeight : Infinity;
        const maxWidth = Math.min(this.maxWidth ?? Infinity, effectiveContainerWidth) - padding * 2;
        const maxHeight = this.maxHeight ?? effectiveContainerHeight - padding * 2;
        const options = { maxWidth, maxHeight, font: this, textWrap: wrapping };

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

    private updateA11yText(moduleCtx: DynamicContext<ChartRegistry>, axisId: AxisID) {
        if (!this.enabled || !this.text) {
            this.destroyProxyText();
            return;
        }

        const bbox = Transformable.toCanvas(this.node);
        if (!bbox) return;

        if (this.proxyText == null) {
            this.proxyText = moduleCtx.widgets.axisWidgets.acquireTitle(axisId);
            this.proxyTextListeners = [
                this.proxyText.addListener('mousemove', (ev) => this.handleMouseMove(moduleCtx, ev)),
                this.proxyText.addListener('mouseleave', () => this.handleTooltipHide(moduleCtx)),
                this.proxyText.addListener('focus', () => this.handleFocus(moduleCtx)),
                this.proxyText.addListener('blur', () => this.handleTooltipHide(moduleCtx)),
            ];
        }

        // Only update DOM if content changed - avoids unnecessary DOM operations
        const textContent = toPlainText(this.text);
        if (textContent !== this.lastProxyTextContent) {
            this.proxyText.textContent = textContent;
            this.lastProxyTextContent = textContent;
        }

        // Only update bounds if they changed
        const { lastProxyBBox } = this;
        if (
            bbox.x !== lastProxyBBox?.x ||
            bbox.y !== lastProxyBBox?.y ||
            bbox.width !== lastProxyBBox?.width ||
            bbox.height !== lastProxyBBox?.height
        ) {
            moduleCtx.widgets.axisWidgets.setTitleBounds(axisId, bbox);
            this.lastProxyBBox = { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
        }
    }

    private getEffectiveTooltipVisible(): 'auto' | 'always' | 'never' {
        const { visible, text, renderer } = this.tooltip;
        if (visible != null) return visible;
        return text != null || renderer != null ? 'always' : 'auto';
    }

    private getTooltipContent(moduleCtx: DynamicContext<ChartRegistry>): TooltipContent | undefined {
        const captionText = toPlainText(this.text);
        const { renderer, text } = this.tooltip;

        if (renderer != null) {
            const params: AgCaptionTooltipRendererParams = { text: captionText };
            const result = callWithContext(moduleCtx.chartService, renderer, params);
            if (result === '') return undefined;
            if (result != null) return { type: 'raw', rawHtmlString: toTextString(result) };
        }

        const displayText = text ?? captionText;
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

    private handleMouseMove(moduleCtx: DynamicContext<ChartRegistry>, event?: MouseWidgetEvent<'mousemove'>) {
        if (event == null) return;

        const { x, y } = Transformable.toCanvas(this.node);
        const canvasX = event.sourceEvent.offsetX + x;
        const canvasY = event.sourceEvent.offsetY + y;
        this.showTooltip(moduleCtx, canvasX, canvasY);
    }

    private handleFocus(moduleCtx: DynamicContext<ChartRegistry>) {
        const bbox = Transformable.toCanvas(this.node);
        if (!bbox) return;

        const canvasX = bbox.x + bbox.width / 2;
        const canvasY = bbox.y + bbox.height / 2;
        this.showTooltip(moduleCtx, canvasX, canvasY);
    }

    private handleTooltipHide(moduleCtx: DynamicContext<ChartRegistry>) {
        moduleCtx.tooltipManager.removeTooltip(this.id, undefined, true);
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
        // The widget itself is owned by AxisWidgets, not the caption; release it there.
        this.a11yContext?.moduleCtx.widgets.axisWidgets.releaseTitle(this.a11yContext.axisId);
        this.proxyText = undefined;
        this.lastProxyTextContent = undefined;
        this.lastProxyBBox = undefined;
    }
}
