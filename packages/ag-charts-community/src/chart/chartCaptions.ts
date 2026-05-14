import type { DynamicContext } from 'ag-charts-core';
import { cachedTextMeasurer, isArray, measureTextSegments, toTextString } from 'ag-charts-core';
import type { TextAlign } from 'ag-charts-types';

import type { LayoutCompleteEvent } from '../core/eventsHub';
import type { ChartRegistry } from '../module/moduleContext';
import type { BBox } from '../scene/bbox';
import { ChartCaption } from './chartCaption';
import type { LayoutContext } from './layout/layoutManager';

export class ChartCaptions {
    readonly title: ChartCaption;
    readonly subtitle: ChartCaption;
    readonly footnote: ChartCaption;

    constructor(ctx: DynamicContext<ChartRegistry>) {
        this.title = new ChartCaption(ctx, 'title');
        this.subtitle = new ChartCaption(ctx, 'subtitle');
        this.footnote = new ChartCaption(ctx, 'footnote');
    }

    positionCaptions({ layoutBox }: LayoutContext) {
        const { title, subtitle, footnote } = this;
        const maxHeight = layoutBox.height / 10; // Limit to 10% of layout initial height

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
            if (caption.layoutStyle !== 'overlay') continue;

            if (caption.textAlign === 'left') {
                caption.node.x = rect.x + caption.padding;
            } else if (caption.textAlign === 'right') {
                const bbox = caption.node.getBBox();
                caption.node.x = rect.x + rect.width - bbox.width - caption.padding;
            }
        }
    }

    private computeX(align: TextAlign, layoutBox: BBox): number {
        if (align === 'left') {
            return layoutBox.x;
        } else if (align === 'right') {
            return layoutBox.x + layoutBox.width;
        }
        return layoutBox.x + layoutBox.width / 2;
    }

    private positionCaption(vAlign: 'top' | 'bottom', caption: ChartCaption, layoutBox: BBox, maxHeight: number) {
        caption.applyToNode();
        // Position the node even when text is empty so its bbox reserves a line of space —
        // an `enabled: true` caption with `text: ''` should still occupy layout (AG-16511).
        caption.node.x = this.computeX(caption.textAlign, layoutBox) + caption.padding;
        caption.node.y = layoutBox.y + (vAlign === 'top' ? 0 : layoutBox.height) + caption.padding;
        caption.node.textBaseline = vAlign;
        if (!caption.text) return;
        const { lineMetrics } = isArray(caption.text)
            ? measureTextSegments(caption.text, caption)
            : cachedTextMeasurer(caption).measureLines(toTextString(caption.text));
        const containerHeight = Math.max(lineMetrics[0].height, maxHeight);
        caption.computeTextWrap(layoutBox.width, containerHeight);
    }

    private shrinkLayoutByCaption(vAlign: 'top' | 'bottom', caption: ChartCaption, layoutBox: BBox) {
        if (caption.layoutStyle !== 'block') return;

        const bbox = caption.node.getBBox().clone();
        const spacing = caption.spacing ?? 0;

        // Empty text yields a zero-height bbox from the Text node; reserve one line of font
        // height so an enabled caption with `text: ''` still occupies layout space (AG-16511).
        if (bbox.height === 0) {
            bbox.height = cachedTextMeasurer(caption).lineHeight();
            if (vAlign === 'bottom') bbox.y -= bbox.height;
        }

        if (vAlign === 'bottom' && isArray(caption.text)) {
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
