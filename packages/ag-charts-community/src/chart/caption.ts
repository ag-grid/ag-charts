import type { ModuleContext } from '../module/moduleContext';
import type { FontStyle, FontWeight, TextWrap } from '../options/agChartOptions';
import { PointerEvents } from '../scene/node';
import { Text } from '../scene/shape/text';
import { createId } from '../util/id';
import { ProxyPropertyOnWrite } from '../util/proxy';
import {
    BOOLEAN,
    COLOR_STRING,
    FONT_STYLE,
    FONT_WEIGHT,
    POSITIVE_NUMBER,
    STRING,
    TEXT_WRAP,
    Validate,
} from '../util/validation';
import type { InteractionEvent } from './interaction/interactionManager';
import { toTooltipHtml } from './tooltip/tooltip';

export class Caption {
    static readonly SMALL_PADDING = 10;
    static readonly LARGE_PADDING = 20;

    readonly id = createId(this);
    readonly node: Text = new Text();

    @Validate(BOOLEAN)
    enabled = false;

    @Validate(STRING, { optional: true })
    @ProxyPropertyOnWrite('node')
    text?: string = undefined;

    @Validate(FONT_STYLE, { optional: true })
    @ProxyPropertyOnWrite('node')
    fontStyle: FontStyle | undefined;

    @Validate(FONT_WEIGHT, { optional: true })
    @ProxyPropertyOnWrite('node')
    fontWeight: FontWeight | undefined;

    @Validate(POSITIVE_NUMBER)
    @ProxyPropertyOnWrite('node')
    fontSize: number = 10;

    @Validate(STRING)
    @ProxyPropertyOnWrite('node')
    fontFamily: string = 'sans-serif';

    @Validate(COLOR_STRING, { optional: true })
    @ProxyPropertyOnWrite('node', 'fill')
    color: string | undefined;

    @Validate(POSITIVE_NUMBER, { optional: true })
    spacing?: number;

    @Validate(POSITIVE_NUMBER, { optional: true })
    lineHeight?: number;

    @Validate(POSITIVE_NUMBER, { optional: true })
    maxWidth?: number = undefined;

    @Validate(POSITIVE_NUMBER, { optional: true })
    maxHeight?: number = undefined;

    @Validate(TEXT_WRAP)
    wrapping: TextWrap = 'always';

    private truncated: boolean = false;

    private destroyFns: Function[] = [];

    constructor(protected readonly moduleCtx: ModuleContext) {
        const node = this.node;
        node.textAlign = 'center';
        node.pointerEvents = PointerEvents.None;

        this.destroyFns.push(moduleCtx.interactionManager.addListener('hover', (e) => this.handleMouseMove(e)));
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

    handleMouseMove(event: InteractionEvent<'hover'>) {
        const { enabled } = this;
        if (!enabled) {
            return;
        }

        const bbox = this.node.computeBBox();
        const { pageX, pageY, offsetX, offsetY } = event;
        const pointerInsideCaption = this.node.visible && bbox.containsPoint(offsetX, offsetY);

        if (!pointerInsideCaption) {
            this.moduleCtx.tooltipManager.removeTooltip(this.id);
            return;
        }

        // Prevent other handlers from consuming this event if it's generated inside the caption
        // boundaries.
        event.consume();

        if (!this.truncated) {
            this.moduleCtx.tooltipManager.removeTooltip(this.id);
            return;
        }

        this.moduleCtx.tooltipManager.updateTooltip(
            this.id,
            { pageX, pageY, offsetX, offsetY, event, showArrow: false, addCustomClass: false },
            toTooltipHtml({ content: this.text })
        );
    }
}
