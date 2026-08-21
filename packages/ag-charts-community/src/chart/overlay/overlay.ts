import {
    BaseProperties,
    type NormalisedTextOrSegments,
    Property,
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
import type { BBox } from '../../scene/bbox';
import type { AnimationManager } from '../interaction/animationManager';

export const DEFAULT_OVERLAY_CLASS = 'ag-charts-overlay';
export const DEFAULT_OVERLAY_DARK_CLASS = 'ag-charts-dark-overlay';

function imageVerticalAlignToCss(verticalAlign: ImageSegment['verticalAlign']): string {
    switch (verticalAlign) {
        case 'top':
            return 'top';
        case 'bottom':
            return 'bottom';
        case 'baseline':
            return 'baseline';
        case 'middle':
        default:
            return 'middle';
    }
}

// Mirrors the canvas ImageSegmentNode decoration. Exported for unit testing — jsdom cannot host a
// real <img>.
export function imageSegmentStyle(segment: ImageSegment): Partial<CSSStyleDeclaration> {
    const { top, right, bottom, left } = resolvePadding(segment.padding);
    return {
        boxSizing: 'border-box',
        objectFit: 'contain',
        width: `${segment.width}px`,
        height: `${segment.height}px`,
        padding: `${top}px ${right}px ${bottom}px ${left}px`,
        verticalAlign: imageVerticalAlignToCss(segment.verticalAlign),
        backgroundColor: segment.backgroundFill ?? '',
        borderRadius: segment.cornerRadius == null ? '' : `${segment.cornerRadius}px`,
    };
}

export class Overlay extends BaseProperties {
    @Property
    enabled = true;

    @Property
    text?: NormalisedTextOrSegments;

    @Property
    renderer?: Renderer<AgChartOverlayRendererParams<DatumDefault>, HTMLElement>;

    private content?: HTMLElement;
    private rendererAsText?: string;
    public focusBox?: BBox;

    constructor(
        protected className: string,
        protected defaultMessageId: string
    ) {
        super();
    }

    getText(localeManager: LocaleManager): string {
        if (isArray(this.text)) {
            return toPlainText(this.text);
        }
        if (this.rendererAsText) {
            return this.rendererAsText;
        }
        return localeManager.t(toTextString(this.text) || this.defaultMessageId);
    }

    getElement(
        callers: Parameters<typeof callWithContext>[0],
        animationManager: AnimationManager | undefined,
        localeManager: LocaleManager,
        rect: BBox
    ) {
        this.content?.remove();
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
            const content = createElement('div', {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                height: '100%',
                margin: '8px',
                fontFamily: 'var(--ag-charts-font-family)',
                fontSize: 'var(--ag-charts-font-size)',
                fontWeight: 'var(--ag-charts-font-weight)',
                color: 'var(--ag-charts-text-color)',
            });
            if (isArray(this.text)) {
                const container = createElement('div');
                for (const segment of this.text) {
                    if (segment.type === 'image') {
                        this.appendImageSegment(container, segment);
                        continue;
                    }
                    const el = createElement('span', {
                        color: segment.color,
                        fontSize: `${segment.fontSize}px`,
                        fontFamily: segment.fontFamily ?? 'inherit',
                        fontWeight: String(segment.fontWeight),
                        fontStyle: segment.fontStyle,
                    });
                    el.innerText = toTextString(segment.text);
                    container.appendChild(el);
                }
                content.appendChild(container);
            } else {
                content.innerText = this.getText(localeManager);
            }
            this.content = content;
            this.content.classList.add(this.className);

            animationManager?.animate({
                from: 0,
                to: 1,
                id: 'overlay',
                phase: 'add',
                groupId: 'opacity',
                onUpdate(value) {
                    content.style.opacity = String(value);
                },
                onStop() {
                    content.style.opacity = '1';
                },
            });
        }

        return this.content;
    }

    // Overlays are plain DOM, so the browser loads the image natively — ImageLoader exists only for
    // the canvas pipeline.
    private appendImageSegment(container: HTMLElement, segment: ImageSegment) {
        const img = createElement('img', imageSegmentStyle(segment));
        img.src = segment.url;
        img.alt = segment.alt ?? '';
        container.appendChild(img);
    }

    // Keeps the keyboard-focus rect aligned with the series/container rect while the element stays
    // mounted, so a resize does not need a remount (which would restart the fade-in animation).
    reposition(rect: BBox) {
        if (this.content) {
            this.focusBox = rect;
        }
    }

    removeElement(cleanup = () => this.content?.remove(), animationManager?: AnimationManager) {
        if (!this.content) return;

        if (animationManager) {
            const { content } = this;
            animationManager.animate({
                from: 1,
                to: 0,
                phase: 'remove',
                id: 'overlay',
                groupId: 'opacity',
                onUpdate(value) {
                    content.style.opacity = String(value);
                },
                onStop() {
                    cleanup?.();
                },
            });
        } else {
            cleanup?.();
        }

        this.content = undefined;
        this.focusBox = undefined;
    }
}
