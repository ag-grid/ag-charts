import type { ModuleContext } from '../module/moduleContext';
import type { FontStyle, FontWeight, TextAlign, TextWrap } from '../options/agChartOptions';
import { PointerEvents } from '../scene/node';
import { Text } from '../scene/shape/text';
import { createId } from '../util/id';
import { BaseProperties } from '../util/properties';
import { ProxyPropertyOnWrite } from '../util/proxy';
import {
    BOOLEAN,
    COLOR_STRING,
    FONT_STYLE,
    FONT_WEIGHT,
    POSITIVE_NUMBER,
    STRING,
    TEXT_ALIGN,
    TEXT_WRAP,
    Validate,
} from '../util/validation';
import type { CaptionLike } from './captionLike';
import type { InteractionEvent } from './interaction/interactionManager';
import { toTooltipHtml } from './tooltip/tooltip';

export class Caption extends BaseProperties implements CaptionLike {
    static readonly SMALL_PADDING = 10;
    static readonly LARGE_PADDING = 20;

    readonly id = createId(this);
    readonly node = new Text().setProperties({
        textAlign: 'center',
        pointerEvents: PointerEvents.None,
    });

    @Validate(BOOLEAN)
    enabled = false;

    @Validate(STRING, { optional: true })
    @ProxyPropertyOnWrite('node')
    text?: string;

    @Validate(TEXT_ALIGN, { optional: true })
    @ProxyPropertyOnWrite('node')
    textAlign: TextAlign = 'center';

    @Validate(FONT_STYLE, { optional: true })
    @ProxyPropertyOnWrite('node')
    fontStyle?: FontStyle;

    @Validate(FONT_WEIGHT, { optional: true })
    @ProxyPropertyOnWrite('node')
    fontWeight?: FontWeight;

    @Validate(POSITIVE_NUMBER)
    @ProxyPropertyOnWrite('node')
    fontSize: number = 10;

    @Validate(STRING)
    @ProxyPropertyOnWrite('node')
    fontFamily: string = 'sans-serif';

    @Validate(COLOR_STRING, { optional: true })
    @ProxyPropertyOnWrite('node', 'fill')
    color?: string;

    @Validate(POSITIVE_NUMBER, { optional: true })
    spacing?: number;

    @Validate(POSITIVE_NUMBER, { optional: true })
    lineHeight?: number;

    @Validate(POSITIVE_NUMBER, { optional: true })
    maxWidth?: number;

    @Validate(POSITIVE_NUMBER, { optional: true })
    maxHeight?: number;

    @Validate(TEXT_WRAP)
    wrapping: TextWrap = 'always';

    private truncated = false;

    registerInteraction(moduleCtx: ModuleContext) {
        const rootRegion = moduleCtx.regionManager.getRegion('root');
        return rootRegion.addListener('hover', (event) => this.handleMouseMove(moduleCtx, event));
    }

    computeTextWrap(containerWidth: number, containerHeight: number) {
        const { text, wrapping } = this;
        const maxWidth = Math.min(this.maxWidth ?? Infinity, containerWidth);
        const maxHeight = this.maxHeight ?? containerHeight;
        if (!isFinite(maxWidth) && !isFinite(maxHeight)) {
            this.node.text = text;
            return;
        }
        const { text: wrappedText, truncated } = Text.wrap(text ?? '', maxWidth, maxHeight, this, wrapping);
        this.node.text = wrappedText;
        this.truncated = truncated;
    }

    handleMouseMove(moduleCtx: ModuleContext, event: InteractionEvent<'hover'>) {
        if (!this.enabled) {
            return;
        }

        const { offsetX, offsetY } = event;
        const bbox = this.node.computeBBox();
        const pointerInsideCaption = this.node.visible && bbox.containsPoint(offsetX, offsetY);

        if (pointerInsideCaption) {
            // Prevent other handlers from consuming this event if it's generated inside the caption
            // boundaries.
            event.consume();
        }

        if (!this.truncated || !pointerInsideCaption) {
            moduleCtx.tooltipManager.removeTooltip(this.id);
        } else {
            moduleCtx.tooltipManager.updateTooltip(
                this.id,
                { offsetX, offsetY, lastPointerEvent: event, showArrow: false, addCustomClass: false },
                toTooltipHtml({ content: this.text })
            );
        }
    }
}
