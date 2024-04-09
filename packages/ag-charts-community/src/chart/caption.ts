import type { ModuleContext } from '../module/moduleContext';
import type { FontStyle, FontWeight, TextAlign, TextWrap } from '../options/agChartOptions';
import { PointerEvents } from '../scene/node';
import { Text } from '../scene/shape/text';
import { joinFunctions } from '../util/function';
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
import type { PointerInteractionEvent } from './interaction/interactionManager';
import type { KeyNavEvent } from './interaction/keyNavManager';
import { TooltipPointerEvent, toTooltipHtml } from './tooltip/tooltip';

export class Caption extends BaseProperties implements CaptionLike {
    static readonly SMALL_PADDING = 10;
    static readonly LARGE_PADDING = 20;

    readonly id = createId(this);
    readonly node = new Text({ zIndex: 1 }).setProperties({
        textAlign: 'center',
        pointerEvents: PointerEvents.None,
    });

    @Validate(BOOLEAN)
    enabled: boolean = false;

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

    private getOrAddRegion(moduleCtx: ModuleContext, regionName: 'root' | 'title' | 'subtitle' | 'footnote') {
        if (regionName === 'root') {
            return moduleCtx.regionManager.getRegion('root');
        } else {
            return moduleCtx.regionManager.addRegion(regionName, this.node);
        }
    }

    registerInteraction(moduleCtx: ModuleContext, regionName: 'root' | 'title' | 'subtitle' | 'footnote') {
        const region = this.getOrAddRegion(moduleCtx, regionName);
        const destroyFns = [
            region.addListener('hover', (event) => this.handleMouseMove(moduleCtx, event)),
            region.addListener('leave', (event) => this.handleMouseLeave(moduleCtx, event)),
        ];
        if (regionName !== 'root') {
            destroyFns.push(
                region.addListener('tab', (event) => this.handleFocus(moduleCtx, event)),
                region.addListener('blur', (event) => this.handleBlur(moduleCtx, event))
            );
        }

        return joinFunctions(...destroyFns);
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

    private updateTooltip(moduleCtx: ModuleContext, event: TooltipPointerEvent) {
        if (this.enabled && this.node.visible && this.truncated) {
            const { offsetX, offsetY } = event;
            moduleCtx.tooltipManager.updateTooltip(
                this.id,
                { offsetX, offsetY, lastPointerEvent: event, showArrow: false },
                toTooltipHtml({ content: this.text })
            );
            return true;
        }
        return false;
    }

    handleMouseMove(moduleCtx: ModuleContext, event: PointerInteractionEvent<'hover'>) {
        if (this.updateTooltip(moduleCtx, event)) {
            // Prevent other handlers from consuming this event if it's generated inside the caption
            // boundaries.
            event.consume();
        }
    }

    handleMouseLeave(moduleCtx: ModuleContext, _event: PointerInteractionEvent<'leave'>) {
        moduleCtx.tooltipManager.removeTooltip(this.id);
    }

    handleFocus(moduleCtx: ModuleContext, _event: KeyNavEvent<'tab'>) {
        const bbox = this.node.computeBBox();
        moduleCtx.regionManager.updateFocusIndicatorRect(bbox);
        if (bbox !== undefined) {
            const { x: offsetX, y: offsetY } = bbox.computeCenter();
            this.updateTooltip(moduleCtx, { type: 'keyboard', offsetX, offsetY });
        }
    }

    handleBlur(moduleCtx: ModuleContext, _event: KeyNavEvent<'blur'>) {
        moduleCtx.regionManager.updateFocusIndicatorRect(undefined);
        moduleCtx.tooltipManager.removeTooltip(this.id);
    }
}
