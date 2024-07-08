import type { TextAlign } from 'ag-charts-types';

import type { LayoutContext } from '../../module/baseModule';
import { Text } from '../../scene/shape/text';
import { Logger } from '../../util/logger';
import { Caption } from '../caption';
import type { DOMManager } from '../dom/domManager';
import type { LayoutCompleteEvent, LayoutService } from '../layout/layoutService';
import type { ChartLike, UpdateProcessor } from './processor';

export class BaseLayoutProcessor implements UpdateProcessor {
    private readonly destroyFns: (() => void)[] = [];

    constructor(
        private readonly chartLike: ChartLike,
        private readonly layoutService: LayoutService,
        private readonly domManager: DOMManager
    ) {
        this.destroyFns.push(
            // eslint-disable-next-line sonarjs/no-duplicate-string
            this.layoutService.addListener('start-layout', (e) => this.positionPadding(e)),
            this.layoutService.addListener('layout-complete', (e) => this.alignCaptions(e)),
            this.layoutService.addListener('start-layout', (e) => this.positionCaptions(e))
        );
    }

    destroy() {
        this.destroyFns.forEach((cb) => cb());
    }

    private positionPadding(ctx: LayoutContext) {
        const { shrinkRect } = ctx;
        const { padding } = this.chartLike;

        shrinkRect.shrink(padding.left, 'left');
        shrinkRect.shrink(padding.top, 'top');
        shrinkRect.shrink(padding.right, 'right');
        shrinkRect.shrink(padding.bottom, 'bottom');

        return { ...ctx, shrinkRect };
    }

    private positionCaptions(ctx: LayoutContext) {
        const { shrinkRect, positions, padding } = ctx;
        const { title, subtitle, footnote, titlePadding } = this.chartLike;
        const paddedShrinkRect = shrinkRect.clone().shrink(titlePadding);
        const newShrinkRect = shrinkRect.clone();

        const updateCaption = (caption: Caption) => {
            const defaultCaptionHeight = shrinkRect.height / 10;
            const captionLineHeight = caption.lineHeight ?? caption.fontSize * Text.defaultLineHeightRatio;
            const maxWidth = shrinkRect.width;
            const maxHeight = Math.max(captionLineHeight, defaultCaptionHeight);
            caption.computeTextWrap(maxWidth, maxHeight);
        };

        const computeX = (align: TextAlign): number => {
            if (align === 'left') {
                return paddedShrinkRect.x;
            } else if (align === 'right') {
                return paddedShrinkRect.x + paddedShrinkRect.width;
            } else if (align !== 'center') {
                Logger.error(`invalid textAlign value: ${align}`);
            }
            return paddedShrinkRect.x + paddedShrinkRect.width / 2;
        };

        const positionTopAndShrinkBBox = (caption: Caption, spacing: number) => {
            const baseY = paddedShrinkRect.y;
            caption.node.x = computeX(caption.textAlign);
            caption.node.y = baseY;
            caption.node.textBaseline = 'top';
            updateCaption(caption);
            const bbox = caption.node.computeBBox();

            // As the bbox (x,y) ends up at a different location than specified above, we need to
            // take it into consideration when calculating how much space needs to be reserved to
            // accommodate the caption.
            const bboxHeight = Math.ceil(bbox.y - baseY + bbox.height + spacing);

            if (caption.layoutStyle === 'block') {
                newShrinkRect.shrink(bboxHeight + 2 * titlePadding, 'top');
                paddedShrinkRect.shrink(bboxHeight, 'top');
            }
            return bbox;
        };
        const positionBottomAndShrinkBBox = (caption: Caption, spacing: number) => {
            const baseY = paddedShrinkRect.y + paddedShrinkRect.height;
            caption.node.x = computeX(caption.textAlign);
            caption.node.y = baseY;
            caption.node.textBaseline = 'bottom';
            updateCaption(caption);
            const bbox = caption.node.computeBBox();

            const bboxHeight = Math.ceil(baseY - bbox.y + spacing);

            if (caption.layoutStyle === 'block') {
                newShrinkRect.shrink(bboxHeight + 2 * titlePadding, 'bottom');
                paddedShrinkRect.shrink(bboxHeight, 'bottom');
            }
            return bbox;
        };

        title.node.visible = title.enabled;
        subtitle.node.visible = subtitle.enabled;
        footnote.node.visible = footnote.enabled;

        if (title.enabled) {
            const { spacing = subtitle.enabled ? Caption.SMALL_PADDING : Caption.LARGE_PADDING } = title;
            positions.title = positionTopAndShrinkBBox(title, spacing);
        }

        if (subtitle.enabled) {
            positions.subtitle = positionTopAndShrinkBBox(subtitle, subtitle.spacing ?? 0);
        }

        if (footnote.enabled) {
            positions.footnote = positionBottomAndShrinkBBox(footnote, footnote.spacing ?? 0);
        }

        padding.title = titlePadding;

        return { ...ctx, shrinkRect: newShrinkRect, positions };
    }

    alignCaptions(ctx: LayoutCompleteEvent): void {
        const { rect } = ctx.series;
        const { title, subtitle, footnote, titlePadding } = this.chartLike;

        for (const caption of [title, subtitle, footnote]) {
            if (caption.layoutStyle !== 'overlay') continue;

            if (caption.textAlign === 'left') {
                caption.node.x = rect.x + titlePadding;
            } else if (caption.textAlign === 'right') {
                const bbox = caption.node.computeBBox();
                caption.node.x = rect.x + rect.width - bbox.width - titlePadding;
            }
        }

        [title, subtitle, footnote].forEach((c) => c.updateA11yParagraph(this.domManager));
    }
}
