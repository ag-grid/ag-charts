import { cachedTextMeasurer, isArray, measureTextSegments } from 'ag-charts-core';
import type { TextAlign } from 'ag-charts-types';

import type { LayoutCompleteEvent } from '../core/eventsHub';
import type { LayoutContext } from '../module/baseModule';
import type { BBox } from '../scene/bbox';
import { Property } from '../util/properties';
import { Caption } from './caption';

export class ChartCaptions {
    @Property
    readonly title = new Caption();

    @Property
    readonly subtitle = new Caption();

    @Property
    readonly footnote = new Caption();

    positionCaptions(ctx: LayoutContext) {
        const { title, subtitle, footnote } = this;
        const maxHeight = ctx.layoutBox.height / 10; // Limit to 10% of layout initial height

        if (title.enabled) {
            this.positionCaption('top', title, ctx.layoutBox, maxHeight);
            this.shrinkLayoutByCaption('top', title, ctx.layoutBox);
        }
        if (subtitle.enabled) {
            this.positionCaption('top', subtitle, ctx.layoutBox, maxHeight);
            this.shrinkLayoutByCaption('top', subtitle, ctx.layoutBox);
        }
        if (footnote.enabled) {
            this.positionCaption('bottom', footnote, ctx.layoutBox, maxHeight);
            this.shrinkLayoutByCaption('bottom', footnote, ctx.layoutBox);
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

    private positionCaption(vAlign: 'top' | 'bottom', caption: Caption, layoutBox: BBox, maxHeight: number) {
        if (!caption.text) return;
        const { lineMetrics } = isArray(caption.text)
            ? measureTextSegments(caption.text, caption)
            : cachedTextMeasurer(caption).measureLines(caption.text);
        const containerHeight = Math.max(lineMetrics[0].height, maxHeight);
        caption.node.x = this.computeX(caption.textAlign, layoutBox) + caption.padding;
        caption.node.y = layoutBox.y + (vAlign === 'top' ? 0 : layoutBox.height) + caption.padding;
        caption.node.textBaseline = vAlign;
        caption.computeTextWrap(layoutBox.width, containerHeight);
    }

    private shrinkLayoutByCaption(vAlign: 'top' | 'bottom', caption: Caption, layoutBox: BBox) {
        if (caption.layoutStyle === 'block') {
            const bbox = caption.node.getBBox().clone();
            const { spacing = 0 } = caption;
            if (vAlign === 'bottom' && isArray(caption.text)) {
                caption.node.y -= bbox.height;
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
}
