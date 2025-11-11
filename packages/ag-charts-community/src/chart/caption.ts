import {
    BaseProperties,
    Property,
    ProxyPropertyOnWrite,
    createId,
    isArray,
    isSegmentTruncated,
    isTextTruncated,
    toPlainText,
    wrapText,
    wrapTextSegments,
} from 'ag-charts-core';
import type { FontStyle, FontWeight, TextAlign, TextOrSegments, TextWrap } from 'ag-charts-types';

import type { ModuleContext } from '../module/moduleContext';
import { PointerEvents } from '../scene/node';
import { RotatableText } from '../scene/shape/text';
import { Transformable } from '../scene/transformable';
import type { BoundedTextWidget } from '../widget/boundedTextWidget';
import type { MouseWidgetEvent } from '../widget/widgetEvents';
import type { CaptionLike } from './captionLike';
import { FONT_SIZE } from './themes/constants';

export class Caption extends BaseProperties implements CaptionLike {
    static readonly SMALL_PADDING = 10;

    readonly id = createId(this);
    readonly node = new RotatableText({ zIndex: 1 }).setProperties({
        textAlign: 'center',
        pointerEvents: PointerEvents.None,
    });

    @Property
    @ProxyPropertyOnWrite('node', 'visible')
    enabled: boolean = false;

    @Property
    @ProxyPropertyOnWrite('node')
    text?: TextOrSegments;

    @Property
    @ProxyPropertyOnWrite('node')
    textAlign: TextAlign = 'center';

    @Property
    @ProxyPropertyOnWrite('node')
    fontStyle?: FontStyle;

    @Property
    @ProxyPropertyOnWrite('node')
    fontWeight?: FontWeight;

    @Property
    @ProxyPropertyOnWrite('node')
    fontSize: number = FONT_SIZE.SMALLER;

    @Property
    @ProxyPropertyOnWrite('node')
    fontFamily: string = 'sans-serif';

    @Property
    @ProxyPropertyOnWrite('node', 'fill')
    color?: string;

    @Property
    spacing?: number;

    @Property
    maxWidth?: number;

    @Property
    maxHeight?: number;

    @Property
    wrapping: TextWrap = 'always';

    @Property
    padding: number = 0;

    @Property
    layoutStyle: 'block' | 'overlay' = 'block';

    private truncated = false;
    private proxyText?: BoundedTextWidget;
    private proxyTextListeners?: Array<() => void>;

    registerInteraction(moduleCtx: ModuleContext, where: 'beforebegin' | 'afterend') {
        return moduleCtx.eventsHub.on('layout:complete', () => this.updateA11yText(moduleCtx, where));
    }

    computeTextWrap(containerWidth: number, containerHeight: number) {
        const { text, padding, wrapping } = this;
        const maxWidth = Math.min(this.maxWidth ?? Infinity, containerWidth) - padding * 2;
        const maxHeight = this.maxHeight ?? containerHeight - padding * 2;
        const options = { maxWidth, maxHeight, font: this, textWrap: wrapping };

        if (!Number.isFinite(maxWidth) && !Number.isFinite(maxHeight)) {
            this.node.text = text;
            return;
        }

        let wrappedText;
        if (isArray(text)) {
            wrappedText = wrapTextSegments(text, options);
            this.truncated = wrappedText.some(isSegmentTruncated);
        } else {
            wrappedText = wrapText(text ?? '', options);
            this.truncated = isTextTruncated(wrappedText);
        }
        this.node.text = wrappedText;
    }

    private updateA11yText(moduleCtx: ModuleContext, where: 'beforebegin' | 'afterend') {
        const { proxyInteractionService } = moduleCtx;
        if (!this.enabled || !this.text) {
            this.destroyProxyText();
            return;
        }

        const bbox = Transformable.toCanvas(this.node);
        if (!bbox) return;

        const { id: domManagerId } = this;
        if (this.proxyText == null) {
            this.proxyText = proxyInteractionService.createProxyElement({ type: 'text', domManagerId, where });
            this.proxyTextListeners = [
                this.proxyText.addListener('mousemove', (ev) => this.handleMouseMove(moduleCtx, ev)),
                this.proxyText.addListener('mouseleave', (ev) => this.handleMouseLeave(moduleCtx, ev)),
            ];
        }
        this.proxyText.textContent = toPlainText(this.text);
        this.proxyText.setBounds(bbox);
    }

    private handleMouseMove(moduleCtx: ModuleContext, event?: MouseWidgetEvent<'mousemove'>) {
        if (event != null && this.enabled && this.truncated) {
            const { x, y } = Transformable.toCanvas(this.node);
            const canvasX = event.sourceEvent.offsetX + x;
            const canvasY = event.sourceEvent.offsetY + y;
            moduleCtx.tooltipManager.updateTooltip(this.id, { canvasX, canvasY, showArrow: false }, [
                { type: 'structured', title: toPlainText(this.text) },
            ]);
        }
    }

    private handleMouseLeave(moduleCtx: ModuleContext, _event: MouseWidgetEvent<'mouseleave'>) {
        moduleCtx.tooltipManager.removeTooltip(this.id, undefined, true); // true = delayed
    }

    destroy() {
        this.destroyProxyText();
    }

    private destroyProxyText() {
        if (this.proxyText == null) return;

        for (const cleanup of this.proxyTextListeners ?? []) {
            cleanup();
        }
        this.proxyTextListeners = undefined;
        this.proxyText.destroy();
        this.proxyText = undefined;
    }
}
