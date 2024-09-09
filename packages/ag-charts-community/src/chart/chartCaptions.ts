import type { TextAlign } from 'ag-charts-types';

import type { LayoutContext } from '../module/baseModule';
import type { BBox } from '../scene/bbox';
import { TextUtils } from '../util/textMeasurer';
import { OBJECT, Validate } from '../util/validation';
import { Caption } from './caption';
import { type LayoutCompleteEvent } from './layout/layoutManager';

export class ChartCaptions {
    @Validate(OBJECT)
    readonly title = new Caption();

    @Validate(OBJECT)
    readonly subtitle = new Caption();

    @Validate(OBJECT)
    readonly footnote = new Caption();

    positionCaptions(ctx: LayoutContext) {
        const { title, subtitle, footnote } = this;
        const maxHeight = ctx.layoutBox.height / 10; // Limit to 10% of layout initial height

        if (title.enabled) {
            const { spacing = subtitle.enabled ? Caption.SMALL_PADDING : Caption.LARGE_PADDING } = title;
            this.positionCaption('top', title, ctx.layoutBox, maxHeight);
            this.shrinkLayoutByCaption('top', title, ctx.layoutBox, spacing);
        }
        if (subtitle.enabled) {
            this.positionCaption('top', subtitle, ctx.layoutBox, maxHeight);
            this.shrinkLayoutByCaption('top', subtitle, ctx.layoutBox, subtitle.spacing);
        }
        if (footnote.enabled) {
            this.positionCaption('bottom', footnote, ctx.layoutBox, maxHeight);
            this.shrinkLayoutByCaption('bottom', footnote, ctx.layoutBox, footnote.spacing);
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

    private updateCaption(caption: Caption, layoutBox: BBox, maxHeight: number) {
        caption.computeTextWrap(layoutBox.width, Math.max(TextUtils.getLineHeight(caption.fontSize), maxHeight));
    }

    private positionCaption(vAlign: 'top' | 'bottom', caption: Caption, layoutBox: BBox, maxHeight: number) {
        const baseY = layoutBox.y + (vAlign === 'top' ? 0 : layoutBox.height);
        caption.node.x = this.computeX(caption.textAlign, layoutBox) + caption.padding;
        caption.node.y = baseY + caption.padding;
        caption.node.textBaseline = vAlign;
        this.updateCaption(caption, layoutBox, maxHeight);
    }

    private shrinkLayoutByCaption(vAlign: 'top' | 'bottom', caption: Caption, layoutBox: BBox, spacing: number = 0) {
        if (caption.layoutStyle === 'block') {
            const bbox = caption.node.getBBox();
            layoutBox.shrink(
                vAlign === 'top'
                    ? Math.ceil(bbox.y - layoutBox.y + bbox.height + spacing)
                    : Math.ceil(layoutBox.y + layoutBox.height - bbox.y + spacing),
                vAlign
            );
        }
    }
}
