import {
    type BBox,
    ContainerWidget,
    type ImageBox,
    ImageWidget,
    type NormalisedChartOverlayOptions,
    type NormalisedTextOrSegments,
    TextSpanWidget,
    callWithContext,
    coerceTextValue,
    createElement,
    isArray,
    isHTMLElement,
    resolvePadding,
    toPlainText,
    toTextString,
} from 'ag-charts-core';
import type { AgChartOverlayRendererParams, DatumDefault, ImageSegment, Renderer } from 'ag-charts-types';

import type { LocaleManager } from '../../locale/localeManager';
import type { AnimationManager } from '../interaction/animationManager';

export const DEFAULT_OVERLAY_CLASS = 'ag-charts-overlay';

// Mirrors the canvas ImageSegmentNode decoration. Exported for unit testing — the mocked canvas environment cannot
// host a real <img>.
export function toImageBox(segment: ImageSegment): ImageBox {
    return {
        width: segment.width,
        height: segment.height,
        padding: resolvePadding(segment.padding),
        verticalAlign: segment.verticalAlign ?? 'middle',
        backgroundColor: segment.backgroundFill,
        cornerRadius: segment.cornerRadius,
    };
}

export class Overlay {
    enabled = true;
    text?: NormalisedTextOrSegments;
    renderer?: Renderer<AgChartOverlayRendererParams<DatumDefault>, HTMLElement>;

    private content?: HTMLElement;
    private defaultContent?: ContainerWidget;
    private rendererAsText?: string;
    public focusBox?: BBox;

    constructor(
        protected className: string,
        protected defaultMessageId: string,
        private readonly defaultRenderer?: Overlay['renderer']
    ) {
        this.renderer = defaultRenderer;
    }

    applyOptions(options: NormalisedChartOverlayOptions | undefined) {
        this.enabled = options?.enabled ?? true;
        this.text = options?.text;
        this.renderer = options?.renderer ?? this.defaultRenderer;
    }

    getText(localeManager: LocaleManager): string {
        if (isArray(this.text)) {
            return toPlainText(this.text);
        }
        if (this.rendererAsText != null && this.rendererAsText !== '') {
            return this.rendererAsText;
        }
        const text = toTextString(this.text);
        return localeManager.t(text === '' ? this.defaultMessageId : text);
    }

    getElement(
        callers: Parameters<typeof callWithContext>[0],
        animationManager: AnimationManager | undefined,
        localeManager: LocaleManager,
        rect: BBox
    ) {
        this.detachContent();
        this.defaultContent = undefined;
        this.rendererAsText = undefined;
        this.focusBox = rect;

        // Per the Renderer<P, R> contract `undefined` falls through to the default text; '' renders
        // an empty overlay.
        const params: AgChartOverlayRendererParams<DatumDefault> = {};
        const rendered = this.renderer ? callWithContext(callers, this.renderer, params) : undefined;
        const htmlContent = coerceTextValue(rendered);

        if (typeof htmlContent === 'string' || isHTMLElement(htmlContent)) {
            if (isHTMLElement(htmlContent)) {
                this.content = htmlContent;
            } else {
                const tempDiv = createElement('div');
                tempDiv.innerHTML = htmlContent;
                const { firstElementChild } = tempDiv;
                if (isHTMLElement(firstElementChild) && tempDiv.childElementCount === 1) {
                    this.content = firstElementChild;
                } else {
                    this.content = tempDiv;
                }
            }
            this.rendererAsText = this.content?.textContent?.trim();
        } else {
            const content = this.createDefaultContent(localeManager);
            this.defaultContent = content;
            // TODO: Phase 3 "Common Widget Ancestor" - the overlay is mounted through DOMElementProxy, which takes a
            // raw element, and shares its removal path with user-rendered elements.
            this.content = content.getElement();

            animationManager?.animate({
                from: 0,
                to: 1,
                id: 'overlay',
                phase: 'add',
                groupId: 'opacity',
                onUpdate(value) {
                    content.setOpacity(value);
                },
                onStop() {
                    content.setOpacity(1);
                },
            });
        }

        return this.content;
    }

    private createDefaultContent(localeManager: LocaleManager): ContainerWidget {
        const content = new ContainerWidget();
        content.setCentredThemeText(8);
        content.addClass(this.className);
        if (!isArray(this.text)) {
            content.setInnerText(this.getText(localeManager));
            return content;
        }

        const container = new ContainerWidget();
        for (const segment of this.text) {
            if (segment.type === 'image') {
                // Overlays are plain DOM, so the browser loads the image natively — ImageLoader exists only for the
                // canvas pipeline.
                container.addChild(new ImageWidget(segment.url, segment.alt ?? '', toImageBox(segment)));
                continue;
            }
            const span = new TextSpanWidget();
            span.setTextStyle({
                color: segment.color,
                fontSize: segment.fontSize,
                fontFamily: segment.fontFamily ?? 'inherit',
                fontWeight: segment.fontWeight,
                fontStyle: segment.fontStyle,
                lineHeight: segment.lineHeight,
            });
            span.setInnerText(toTextString(segment.text));
            container.addChild(span);
        }
        content.addChild(container);
        return content;
    }

    // Keeps the keyboard-focus rect aligned with the series/container rect while the element stays
    // mounted, so a resize does not need a remount (which would restart the fade-in animation).
    reposition(rect: BBox) {
        if (this.content) {
            this.focusBox = rect;
        }
    }

    private detachContent() {
        if (this.defaultContent) {
            this.defaultContent.remove();
        } else {
            this.content?.remove();
        }
    }

    removeElement(cleanup = () => this.detachContent(), animationManager?: AnimationManager) {
        if (!this.content) return;

        if (animationManager) {
            const { content, defaultContent } = this;
            animationManager.animate({
                from: 1,
                to: 0,
                phase: 'remove',
                id: 'overlay',
                groupId: 'opacity',
                onUpdate(value) {
                    if (defaultContent) {
                        defaultContent.setOpacity(value);
                    } else {
                        content.style.opacity = String(value);
                    }
                },
                onStop() {
                    cleanup?.();
                },
            });
        } else {
            cleanup?.();
        }

        this.content = undefined;
        this.defaultContent = undefined;
        this.focusBox = undefined;
    }
}
