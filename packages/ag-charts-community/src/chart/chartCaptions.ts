import type { DynamicContext, ResolvedTextAlign } from 'ag-charts-core';
import { cachedTextMeasurer, isArray, measureTextSegments, resolveTextAlign, toTextString } from 'ag-charts-core';

import type { LayoutCompleteEvent } from '../core/eventsHub';
import type { ChartRegistry } from '../module/moduleContext';
import type { BBox } from '../scene/bbox';
import { ChartCaption, captionFont } from './chartCaption';
import type { LayoutContext } from './layout/layoutManager';

export class ChartCaptions {
    readonly title: ChartCaption;
    readonly subtitle: ChartCaption;
    readonly footnote: ChartCaption;

    constructor(private readonly ctx: DynamicContext<ChartRegistry>) {
        this.title = new ChartCaption(ctx, 'title');
        this.subtitle = new ChartCaption(ctx, 'subtitle');
        this.footnote = new ChartCaption(ctx, 'footnote');
    }

    positionCaptions({ layoutBox }: LayoutContext) {
        const { title, subtitle, footnote } = this;
        const maxHeight = layoutBox.height / 10; // Limit to 10% of layout initial height

        // Sync `node.visible` for every caption each layout so a disabled caption's long-lived
        // node is hidden — the enabled-only positioning below never runs for disabled captions.
        for (const caption of [title, subtitle, footnote]) {
            caption.applyToNode();
        }

        if (title.enabled) {
            this.positionCaption('top', title, layoutBox, maxHeight);
            this.shrinkLayoutByCaption('top', title, layoutBox);
        }
        if (subtitle.enabled) {
            this.positionCaption('top', subtitle, layoutBox, maxHeight);
            this.shrinkLayoutByCaption('top', subtitle, layoutBox);
        }
        if (footnote.enabled) {
            this.positionCaption('bottom', footnote, layoutBox, maxHeight);
            this.shrinkLayoutByCaption('bottom', footnote, layoutBox);
        }
    }

    positionAbsoluteCaptions(ctx: LayoutCompleteEvent): void {
        const { title, subtitle, footnote } = this;
        const { rect } = ctx.series;

        for (const caption of [title, subtitle, footnote]) {
            const opts = caption.opts;
            if ((opts.layoutStyle ?? 'block') !== 'overlay') continue;

            const textAlign = resolveTextAlign(opts.textAlign ?? 'center', this.ctx.domManager.isRtl);
            if (textAlign === 'left') {
                caption.node.x = rect.x + caption.contentPadding.left;
            } else if (textAlign === 'right') {
                // A drawn box grows the measured bounds by its padding, so `bbox.width` already
                // accounts for the right inset; an unboxed caption still needs it applied.
                const bbox = caption.node.getBBox();
                const rightInset = caption.contentPadding.right - caption.boxPadding.right;
                caption.node.x = rect.x + rect.width - bbox.width - rightInset;
            }
        }
    }

    private computeX(align: ResolvedTextAlign, layoutBox: BBox): number {
        if (align === 'left') {
            return layoutBox.x;
        } else if (align === 'right') {
            return layoutBox.x + layoutBox.width;
        }
        return layoutBox.x + layoutBox.width / 2;
    }

    private positionCaption(vAlign: 'top' | 'bottom', caption: ChartCaption, layoutBox: BBox, maxHeight: number) {
        const opts = caption.opts;
        const font = captionFont(opts);
        const text = opts.text;
        const textAlign = resolveTextAlign(opts.textAlign ?? 'center', this.ctx.domManager.isRtl);
        const { left, right, top, bottom } = caption.contentPadding;
        // Inset the node so its text (and any background box) sits inside the layout edge. Only
        // left/right alignment gets a horizontal inset — a centred caption must stay centred.
        let xInset = 0;
        if (textAlign === 'left') {
            xInset = left;
        } else if (textAlign === 'right') {
            xInset = -right;
        }
        // Position the node even when text is empty so its bbox reserves a line of space —
        // an `enabled: true` caption with `text: ''` should still occupy layout (AG-16511).
        caption.node.x = this.computeX(textAlign, layoutBox) + xInset;
        caption.node.y = layoutBox.y + (vAlign === 'top' ? top : layoutBox.height - bottom);
        caption.node.textBaseline = vAlign;
        if (!text) return;
        const { lineMetrics } = isArray(text)
            ? measureTextSegments(text, font)
            : cachedTextMeasurer(font).measureLines(toTextString(text));
        const containerHeight = Math.max(lineMetrics[0].height, maxHeight);
        caption.computeTextWrap(layoutBox.width, containerHeight);
    }

    private shrinkLayoutByCaption(vAlign: 'top' | 'bottom', caption: ChartCaption, layoutBox: BBox) {
        const opts = caption.opts;
        if ((opts.layoutStyle ?? 'block') !== 'block') return;

        const bbox = caption.node.getBBox().clone();
        const spacing = opts.spacing ?? 0;

        // Empty text yields a zero-height bbox from the Text node; reserve one line of font
        // height so an enabled caption with `text: ''` still occupies layout space (AG-16511).
        if (bbox.height === 0) {
            bbox.height = cachedTextMeasurer(captionFont(opts)).lineHeight();
            if (vAlign === 'bottom') bbox.y -= bbox.height;
        }

        const richText = isArray(opts.text);
        const { top, bottom } = caption.boxPadding;

        // Boxed segment captions self-account in getBBox; only a non-boxed bottom rich-text caption
        // needs its origin shifted up by its height (its bbox is reported from the text baseline).
        if (richText && top === 0 && bottom === 0 && vAlign === 'bottom') {
            bbox.y -= bbox.height;
        }
        layoutBox.shrink(
            vAlign === 'top'
                ? Math.ceil(bbox.y - layoutBox.y + bbox.height + spacing)
                : Math.ceil(layoutBox.y + layoutBox.height - bbox.y + spacing),
            vAlign
        );
    }
}
