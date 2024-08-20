import type { TextAlign } from 'ag-charts-types';

import type { LayoutContext } from '../../module/baseModule';
import { TextUtils } from '../../util/textMeasurer';
import { Caption } from '../caption';
import { type LayoutCompleteEvent, LayoutElement, type LayoutManager } from '../layout/layoutManager';
import type { ChartLike, UpdateProcessor } from './processor';

export class BaseLayoutProcessor implements UpdateProcessor {
    private readonly destroyFns: (() => void)[] = [];

    constructor(
        private readonly chartLike: ChartLike,
        private readonly layoutManager: LayoutManager
    ) {
        this.destroyFns.push(
            this.layoutManager.registerElement(LayoutElement.Caption, (e) => this.positionCaptions(e)),
            this.layoutManager.addListener('layout:complete', (e) => this.alignCaptions(e))
        );
    }

    destroy() {
        this.destroyFns.forEach((cb) => cb());
    }

    private positionCaptions(ctx: LayoutContext) {
        const { title, subtitle, footnote } = this.chartLike;
        const { layoutBox } = ctx;

        // Apply chart padding
        layoutBox.shrink(this.chartLike.padding.toJson());

        const defaultCaptionHeight = layoutBox.height / 10;

        const updateCaption = (caption: Caption) => {
            const captionLineHeight = TextUtils.getLineHeight(caption.fontSize);
            const maxHeight = Math.max(captionLineHeight, defaultCaptionHeight);
            caption.computeTextWrap(layoutBox.width, maxHeight);
        };

        const computeX = (align: TextAlign): number => {
            if (align === 'left') {
                return layoutBox.x;
            } else if (align === 'right') {
                return layoutBox.x + layoutBox.width;
            }
            return layoutBox.x + layoutBox.width / 2;
        };

        const positionTopAndShrinkBBox = (caption: Caption, spacing: number) => {
            const baseY = layoutBox.y;
            caption.node.x = computeX(caption.textAlign) + caption.padding;
            caption.node.y = baseY + caption.padding;
            caption.node.textBaseline = 'top';
            updateCaption(caption);

            // As the bbox (x,y) ends up at a different location than specified above, we need to
            // take it into consideration when calculating how much space needs to be reserved to
            // accommodate the caption.
            if (caption.layoutStyle === 'block') {
                const bbox = caption.node.getBBox();
                layoutBox.shrink(Math.ceil(bbox.y - baseY + bbox.height + spacing), 'top');
            }
        };
        const positionBottomAndShrinkBBox = (caption: Caption, spacing: number) => {
            const baseY = layoutBox.y + layoutBox.height;
            caption.node.x = computeX(caption.textAlign) + caption.padding;
            caption.node.y = baseY + caption.padding;
            caption.node.textBaseline = 'bottom';
            updateCaption(caption);

            if (caption.layoutStyle === 'block') {
                const bbox = caption.node.getBBox();
                layoutBox.shrink(Math.ceil(baseY - bbox.y + spacing), 'bottom');
            }
        };

        title.node.visible = title.enabled;
        subtitle.node.visible = subtitle.enabled;
        footnote.node.visible = footnote.enabled;

        if (title.enabled) {
            const { spacing = subtitle.enabled ? Caption.SMALL_PADDING : Caption.LARGE_PADDING } = title;
            positionTopAndShrinkBBox(title, spacing);
        }

        if (subtitle.enabled) {
            positionTopAndShrinkBBox(subtitle, subtitle.spacing ?? 0);
        }

        if (footnote.enabled) {
            positionBottomAndShrinkBBox(footnote, footnote.spacing ?? 0);
        }
    }

    alignCaptions(ctx: LayoutCompleteEvent): void {
        const { rect } = ctx.series;
        const { title, subtitle, footnote } = this.chartLike;

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
}
