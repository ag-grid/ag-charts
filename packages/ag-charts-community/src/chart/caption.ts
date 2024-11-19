import type { FontStyle, FontWeight, TextAlign, TextWrap } from 'ag-charts-types';

import type { ModuleContext } from '../module/moduleContext';
import { PointerEvents } from '../scene/node';
import { RotatableText } from '../scene/shape/text';
import { Transformable } from '../scene/transformable';
import { createId } from '../util/id';
import { BaseProperties } from '../util/properties';
import { ProxyPropertyOnWrite } from '../util/proxy';
import { TextUtils } from '../util/textMeasurer';
import { TextWrapper } from '../util/textWrapper';
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
import type { BoundedTextWidget } from '../widget/boundedTextWidget';
import type { MouseWidgetEvent } from '../widget/widgetEvents';
import type { CaptionLike } from './captionLike';
import { toTooltipHtml } from './tooltip/tooltip';

export class Caption extends BaseProperties implements CaptionLike {
    static readonly SMALL_PADDING = 10;
    static readonly LARGE_PADDING = 20;

    readonly id = createId(this);
    readonly node = new RotatableText({ zIndex: 1 }).setProperties({
        textAlign: 'center',
        pointerEvents: PointerEvents.None,
    });

    @Validate(BOOLEAN)
    @ProxyPropertyOnWrite('node', 'visible')
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
    maxWidth?: number;

    @Validate(POSITIVE_NUMBER, { optional: true })
    maxHeight?: number;

    @Validate(TEXT_WRAP)
    wrapping: TextWrap = 'always';

    @Validate(POSITIVE_NUMBER)
    padding: number = 0;

    @Validate(STRING)
    layoutStyle: 'block' | 'overlay' = 'block';

    private truncated = false;
    private proxyText?: BoundedTextWidget;

    registerInteraction(moduleCtx: ModuleContext, where: 'beforebegin' | 'afterend') {
        return moduleCtx.layoutManager.addListener('layout:complete', () => this.updateA11yText(moduleCtx, where));
    }

    computeTextWrap(containerWidth: number, containerHeight: number) {
        const { text, padding, wrapping } = this;
        const maxWidth = Math.min(this.maxWidth ?? Infinity, containerWidth) - padding * 2;
        const maxHeight = this.maxHeight ?? containerHeight - padding * 2;
        if (!isFinite(maxWidth) && !isFinite(maxHeight)) {
            this.node.text = text;
            return;
        }
        const wrappedText = TextWrapper.wrapText(text ?? '', { maxWidth, maxHeight, font: this, textWrap: wrapping });
        this.node.text = wrappedText;
        this.truncated = wrappedText.includes(TextUtils.EllipsisChar);
    }

    private updateA11yText(moduleCtx: ModuleContext, where: 'beforebegin' | 'afterend') {
        const { proxyInteractionService } = moduleCtx;
        if (this.enabled && this.text) {
            const bbox = Transformable.toCanvas(this.node);
            if (bbox) {
                const { id: domManagerId } = this;
                this.proxyText ??= proxyInteractionService.createProxyElement({ type: 'text', domManagerId, where });
                this.proxyText.textContent = this.text;
                this.proxyText.setBounds(bbox);
                this.proxyText.addListener('mousemove', (_target, ev) => this.handleMouseMove(moduleCtx, ev));
                this.proxyText.addListener('mouseleave', (_target, ev) => this.handleMouseLeave(moduleCtx, ev));
            }
        } else {
            this.proxyText?.destroy();
            this.proxyText = undefined;
        }
    }

    private handleMouseMove(moduleCtx: ModuleContext, event?: MouseWidgetEvent) {
        if (event != null && this.enabled && this.node.visible && this.truncated) {
            const { x, y } = Transformable.toCanvas(this.node);
            const offsetX = event.sourceEvent.offsetX + x;
            const offsetY = event.sourceEvent.offsetY + y;
            const lastPointerEvent = { type: 'hover', offsetX, offsetY } as const;
            moduleCtx.tooltipManager.updateTooltip(
                this.id,
                { offsetX, offsetY, lastPointerEvent, showArrow: false },
                toTooltipHtml({ content: this.text })
            );
        }
    }

    private handleMouseLeave(moduleCtx: ModuleContext, _event: MouseWidgetEvent) {
        moduleCtx.tooltipManager.removeTooltip(this.id);
    }
}
