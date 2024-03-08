import type { TextAlign } from '../../options/agChartOptions';
import type { BBox } from '../../scene/bbox';
import { Text } from '../../scene/shape/text';
import { Logger } from '../../util/logger';
import { Caption } from '../caption';
import type { LayoutCompleteEvent, LayoutService } from '../layout/layoutService';
import type { ChartLike, UpdateProcessor } from './processor';

export class BaseLayoutProcessor implements UpdateProcessor {
    private destroyFns: (() => void)[] = [];

    constructor(
        private readonly chartLike: ChartLike,
        private readonly layoutService: LayoutService
    ) {
        this.destroyFns.push(
            // eslint-disable-next-line sonarjs/no-duplicate-string
            this.layoutService.addListener('layout-complete', (e) => this.layoutComplete(e)),
            this.layoutService.addListener('start-layout', (e) => this.positionPadding(e.shrinkRect)),
            this.layoutService.addListener('start-layout', (e) => this.positionCaptions(e.shrinkRect))
        );
    }

    destroy() {
        this.destroyFns.forEach((cb) => cb());
    }

    private layoutComplete({ clipSeries, series: { paddedRect } }: LayoutCompleteEvent): void {
        const { seriesArea, seriesRoot } = this.chartLike;
        if (seriesArea.clip || clipSeries) {
            seriesRoot.setClipRectInGroupCoordinateSpace(paddedRect);
        } else {
            seriesRoot.setClipRectInGroupCoordinateSpace();
        }
    }

    private positionPadding(shrinkRect: BBox) {
        const { padding } = this.chartLike;

        shrinkRect.shrink(padding.left, 'left');
        shrinkRect.shrink(padding.top, 'top');
        shrinkRect.shrink(padding.right, 'right');
        shrinkRect.shrink(padding.bottom, 'bottom');

        return { shrinkRect };
    }

    private positionCaptions(shrinkRect: BBox) {
        const { title, subtitle, footnote } = this.chartLike;
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
                return newShrinkRect.x;
            } else if (align === 'right') {
                return newShrinkRect.x + newShrinkRect.width;
            } else if (align !== 'center') {
                Logger.error(`invalid textAlign value: ${align}`);
            }
            return newShrinkRect.x + newShrinkRect.width / 2;
        };

        const positionTopAndShrinkBBox = (caption: Caption, spacing: number) => {
            const baseY = newShrinkRect.y;
            caption.node.x = computeX(caption.textAlign);
            caption.node.y = baseY;
            caption.node.textBaseline = 'top';
            updateCaption(caption);
            const bbox = caption.node.computeBBox();

            // As the bbox (x,y) ends up at a different location than specified above, we need to
            // take it into consideration when calculating how much space needs to be reserved to
            // accommodate the caption.
            const bboxHeight = Math.ceil(bbox.y - baseY + bbox.height + spacing);

            newShrinkRect.shrink(bboxHeight, 'top');
        };
        const positionBottomAndShrinkBBox = (caption: Caption, spacing: number) => {
            const baseY = newShrinkRect.y + newShrinkRect.height;
            caption.node.x = computeX(caption.textAlign);
            caption.node.y = baseY;
            caption.node.textBaseline = 'bottom';
            updateCaption(caption);
            const bbox = caption.node.computeBBox();

            const bboxHeight = Math.ceil(baseY - bbox.y + spacing);

            newShrinkRect.shrink(bboxHeight, 'bottom');
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

        return { shrinkRect: newShrinkRect };
    }
}
