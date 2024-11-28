import type { InteractionRange, TextWrap } from 'ag-charts-types';

import type { DOMManager } from '../../dom/domManager';
import { getWindow } from '../../util/dom';
import { clamp } from '../../util/number';
import { type Bounds, calculatePlacement } from '../../util/placement';
import { BaseProperties } from '../../util/properties';
import { ObserveChanges } from '../../util/proxy';
import { sanitizeHtml } from '../../util/sanitize';
import {
    BOOLEAN,
    INTERACTION_RANGE,
    NUMBER,
    OBJECT,
    OR,
    POSITIVE_NUMBER,
    STRING,
    STRING_ARRAY,
    TEXT_WRAP,
    UNION,
    Validate,
} from '../../util/validation';
import { type LegendSymbolOptions, legendSymbolSvg } from '../legend/legendSymbol';
import { SpringAnimation } from './springAnimation';

export const DEFAULT_TOOLTIP_CLASS = 'ag-chart-tooltip';
export const DEFAULT_TOOLTIP_DARK_CLASS = 'ag-chart-dark-tooltip';

type TooltipPositionType =
    | 'pointer'
    | 'node'
    | 'top'
    | 'right'
    | 'bottom'
    | 'left'
    | 'top-left'
    | 'top-right'
    | 'bottom-right'
    | 'bottom-left'
    | 'sparkline'
    | 'sparkline-constrained';

type TooltipOffsets = { canvasX: number; canvasY: number };
export type TooltipEventType = 'hover' | 'click' | 'dblclick' | 'keyboard';
export type TooltipPointerEvent<T extends TooltipEventType = TooltipEventType> = TooltipOffsets & { type: T };

export interface TooltipMetaPosition {
    type?: TooltipPositionType;
    xOffset?: number;
    yOffset?: number;
}

export interface TooltipMeta extends TooltipOffsets {
    showArrow?: boolean;
    lastPointerEvent?: TooltipPointerEvent<TooltipEventType>;
    position?: TooltipMetaPosition;
    enableInteraction?: boolean;
}

export type TooltipContentDataRow =
    | { label: string; fallbackLabel?: string; value: string }
    | { label: undefined; fallbackLabel: string; value: string };

export interface TooltipContent {
    heading?: string;
    title?: string;
    symbol?: LegendSymbolOptions;
    data?: TooltipContentDataRow[];
    class?: string;
}

export function tooltipContentAriaLabel(_content: TooltipContent | string) {
    return '';
}

function dataHtml(label: string, value: string, inline: boolean) {
    let rowHtml = '';

    rowHtml += `<span class="${DEFAULT_TOOLTIP_CLASS}__label">${sanitizeHtml(label)}</span>`;
    rowHtml += ' ';
    rowHtml += `<span class="${DEFAULT_TOOLTIP_CLASS}__value">${sanitizeHtml(value)}</span>`;

    const rowClassNames = [`${DEFAULT_TOOLTIP_CLASS}__row`];
    if (inline) rowClassNames.push(`${DEFAULT_TOOLTIP_CLASS}__row--inline`);
    rowHtml = `<div class="${rowClassNames.join(' ')}">${rowHtml}</div>`;

    return rowHtml;
}

function tooltipContentHtml(content: TooltipContent | string) {
    if (typeof content === 'string') return content;

    let html = '';

    if (
        (content.heading == null) !== (content.title == null) &&
        content.data?.length === 1 &&
        content.data[0].label == null &&
        content.data[0].value != null
    ) {
        // Compact rendering
        const datum = content.data[0];

        html += dataHtml((content.heading ?? content.title)!, datum.value, false);
    } else {
        // Full rendering
        const dataInline = content.title == null && content.data?.length === 1;

        if (content.heading != null) {
            html += `<span class="${DEFAULT_TOOLTIP_CLASS}__group-title">${sanitizeHtml(content.heading)}</span>`;
            html += ' ';
        }

        const symbol = content.symbol == null ? undefined : legendSymbolSvg(content.symbol, 12);
        if (symbol != null && (content.title != null || content.data?.length)) {
            html += `<span class="${DEFAULT_TOOLTIP_CLASS}__symbol">${symbol}</span>`;
        }

        if (content.title != null) {
            html += `<span class="${DEFAULT_TOOLTIP_CLASS}__title">${sanitizeHtml(content.title)}</span>`;
            html += ' ';
        }

        content.data?.forEach((datum) => {
            html += dataHtml(datum.label ?? datum.fallbackLabel, datum.value, dataInline);
            html += ' ';
        });
    }

    html = `<div class="${DEFAULT_TOOLTIP_CLASS}__content">${html.trimEnd()}</div>`;

    return html;
}

export class TooltipPosition extends BaseProperties {
    @Validate(
        UNION(
            [
                'pointer',
                'node',
                'top',
                'right',
                'bottom',
                'left',
                'top-left',
                'top-right',
                'bottom-right',
                'bottom-left',
                { value: 'sparkline', undocumented: true },
                { value: 'sparkline-', undocumented: true },
            ],
            'a position type'
        )
    )
    /** The type of positioning for the tooltip. By default, the tooltip follows the pointer. */
    type: TooltipPositionType = 'pointer';

    @Validate(NUMBER)
    /** The horizontal offset in pixels for the position of the tooltip. */
    xOffset: number = 0;

    @Validate(NUMBER)
    /** The vertical offset in pixels for the position of the tooltip. */
    yOffset: number = 0;
}

export class Tooltip extends BaseProperties {
    @Validate(BOOLEAN)
    enabled: boolean = true;

    @Validate(BOOLEAN, { optional: true })
    showArrow?: boolean;

    @ObserveChanges<Tooltip>((target) => target.resetClass())
    @Validate(OR(STRING, STRING_ARRAY), { optional: true })
    class?: string | string[];

    @Validate(POSITIVE_NUMBER)
    delay: number = 0;

    @Validate(INTERACTION_RANGE, { optional: true })
    range?: InteractionRange = undefined;

    @Validate(TEXT_WRAP)
    wrapping: TextWrap = 'hyphenate';

    @Validate(OBJECT)
    readonly position = new TooltipPosition();

    @Validate(BOOLEAN)
    darkTheme = false;

    /** Escape-hatch for changes in AG-11645. */
    @Validate(UNION(['extended', 'canvas']))
    bounds: 'extended' | 'canvas' = 'extended';

    private readonly destroyFns: Array<() => void> = [];
    private readonly springAnimation = new SpringAnimation();

    private enableInteraction: boolean = false;
    private readonly wrapTypes = ['always', 'hyphenate', 'on-space', 'never'];

    private element?: HTMLElement;

    private showTimeout: NodeJS.Timeout | number = 0;
    private _showArrow = true;
    private _visible = false;

    private positionParams:
        | {
              canvasRect: DOMRect;
              relativeRect: { x: number; y: number; width: number; height: number };
              meta: TooltipMeta;
          }
        | undefined = undefined;

    get interactive() {
        return this.enableInteraction;
    }

    constructor() {
        super();

        this.destroyFns.push(this.springAnimation.addListener('update', this.updateTooltipPosition.bind(this)));
    }

    setup(domManager: DOMManager) {
        if ('togglePopover' in getWindow<any>().HTMLElement.prototype) {
            this.element = domManager.addChild('canvas-overlay', DEFAULT_TOOLTIP_CLASS);
            this.element.setAttribute('popover', 'manual');

            this.resetClass();
        }
    }

    destroy(domManager: DOMManager) {
        domManager.removeChild('canvas-overlay', DEFAULT_TOOLTIP_CLASS);
    }

    isVisible(): boolean {
        return this._visible;
    }

    private updateTooltipPosition() {
        const { element, positionParams } = this;
        if (element == null || positionParams == null) return;

        const { canvasRect, relativeRect, meta } = positionParams;
        const { x: canvasX, y: canvasY } = this.springAnimation;

        const positionType = meta.position?.type ?? this.position.type;
        const xOffset = meta.position?.xOffset ?? 0;
        const yOffset = meta.position?.yOffset ?? 0;

        const minX = relativeRect.x;
        const minY = relativeRect.y;
        const maxX = relativeRect.width - element.clientWidth - 1 + minX;
        const maxY = relativeRect.height - element.clientHeight + minY;

        let tooltipBounds = this.getTooltipBounds({ positionType, canvasX, canvasY, yOffset, xOffset, canvasRect });
        let position = calculatePlacement(element.clientWidth, element.clientHeight, relativeRect, tooltipBounds);

        if (positionType === 'sparkline' && (position.x <= minX || position.x >= maxX)) {
            tooltipBounds = this.getTooltipBounds({
                positionType: 'sparkline-constrained',
                canvasX,
                canvasY,
                yOffset,
                xOffset,
                canvasRect,
            });
            position = calculatePlacement(element.clientWidth, element.clientHeight, relativeRect, tooltipBounds);
        }

        const left = clamp(minX, position.x, maxX);
        const top = clamp(minY, position.y, maxY);

        const constrained = left !== position.x || top !== position.y;
        const defaultShowArrow =
            (positionType === 'node' || positionType === 'pointer') && !constrained && !xOffset && !yOffset;
        const showArrow = meta.showArrow ?? this.showArrow ?? defaultShowArrow;
        this.updateShowArrow(showArrow);

        element.style.transform = `translate(${left}px, ${top}px)`;
    }

    private resetClass() {
        const { element, class: className } = this;
        if (element == null) return;

        element.className = DEFAULT_TOOLTIP_CLASS;

        if (Array.isArray(className)) {
            element.classList.add(...className);
        } else if (className != null) {
            element.classList.add(className);
        }
    }

    /**
     * Shows tooltip at the given event's coordinates.
     * If the `html` parameter is missing, moves the existing tooltip to the new position.
     */
    show(
        boundingRect: DOMRect,
        canvasRect: DOMRect,
        meta: TooltipMeta,
        content?: TooltipContent | string | null,
        instantly = false
    ) {
        const { element } = this;

        if (element != null && content != null) {
            this.resetClass();
            if (typeof content !== 'string' && content.class != null) {
                element.classList.add(content.class);
            }

            element.innerHTML = tooltipContentHtml(content);
        } else if (element == null || element.innerHTML === '') {
            this.toggle(false);
            return;
        }

        const relativeRect = {
            x: boundingRect.x - canvasRect.x,
            y: boundingRect.y - canvasRect.y,
            width: boundingRect.width,
            height: boundingRect.height,
        };

        this.positionParams = {
            canvasRect,
            relativeRect,
            meta,
        };

        this.springAnimation.update(meta.canvasX, meta.canvasY);
        element.style.top = `${canvasRect.top}px`;
        element.style.left = `${canvasRect.left}px`;

        if (meta.enableInteraction) {
            this.enableInteraction = true;
            element.style.pointerEvents = 'auto';
            element.removeAttribute('aria-hidden');
        } else {
            this.enableInteraction = false;
            element.style.pointerEvents = 'none';
            element.setAttribute('aria-hidden', 'true');
        }

        if (this.delay > 0 && !instantly) {
            this.toggle(false);
            this.showTimeout = setTimeout(() => {
                this.toggle(true);
            }, this.delay);
        } else {
            this.toggle(true);
        }
    }

    hide() {
        this.springAnimation.reset();
        this.toggle(false);
    }

    private toggle(visible: boolean) {
        if (!this.element?.isConnected) return;

        this._visible = visible;

        const { classList } = this.element;
        const toggleClass = (name: string, include: boolean) =>
            classList.toggle(`${DEFAULT_TOOLTIP_CLASS}-${name}`, include);

        if (!visible) {
            clearTimeout(this.showTimeout);
        }

        toggleClass('no-interaction', !this.enableInteraction); // Prevent interaction.
        toggleClass('arrow', this._showArrow); // Add arrow if tooltip is constrained.

        classList.toggle(DEFAULT_TOOLTIP_DARK_CLASS, this.darkTheme);

        this.element.togglePopover(visible);

        if (visible) {
            // We can only measure the element when it's actually visible
            // This removes a possible jump for the tooltip
            this.updateTooltipPosition();
        }

        for (const wrapType of this.wrapTypes) {
            classList.toggle(`${DEFAULT_TOOLTIP_CLASS}-wrap-${wrapType}`, wrapType === this.wrapping);
        }
    }

    private updateShowArrow(show: boolean) {
        this._showArrow = show;
    }

    private getTooltipBounds(opts: {
        positionType: TooltipPositionType;
        canvasX: number;
        canvasY: number;
        yOffset: number;
        xOffset: number;
        canvasRect: DOMRect;
    }): Bounds {
        if (!this.element) return {};

        const { positionType, canvasX, canvasY, yOffset, xOffset, canvasRect } = opts;

        const { clientWidth: tooltipWidth, clientHeight: tooltipHeight } = this.element;
        const bounds: Bounds = { width: tooltipWidth, height: tooltipHeight };

        switch (positionType) {
            case 'node':
            case 'pointer': {
                bounds.top = canvasY + yOffset - tooltipHeight - 8;
                bounds.left = canvasX + xOffset - tooltipWidth / 2;
                return bounds;
            }
            case 'top': {
                bounds.top = yOffset;
                bounds.left = canvasRect.width / 2 - tooltipWidth / 2 + xOffset;
                return bounds;
            }
            case 'right': {
                bounds.top = canvasRect.height / 2 - tooltipHeight / 2 + yOffset;
                bounds.left = canvasRect.width - tooltipWidth / 2 + xOffset;
                return bounds;
            }
            case 'left': {
                bounds.top = canvasRect.height / 2 - tooltipHeight / 2 + yOffset;
                bounds.left = xOffset;
                return bounds;
            }
            case 'bottom': {
                bounds.top = canvasRect.height - tooltipHeight + yOffset;
                bounds.left = canvasRect.width / 2 - tooltipWidth / 2 + xOffset;
                return bounds;
            }
            case 'top-left': {
                bounds.top = yOffset;
                bounds.left = xOffset;
                return bounds;
            }
            case 'top-right': {
                bounds.top = yOffset;
                bounds.left = canvasRect.width - tooltipWidth + xOffset;
                return bounds;
            }
            case 'bottom-right': {
                bounds.top = canvasRect.height - tooltipHeight + yOffset;
                bounds.left = canvasRect.width - tooltipWidth + xOffset;
                return bounds;
            }
            case 'bottom-left': {
                bounds.top = canvasRect.height - tooltipHeight + yOffset;
                bounds.left = xOffset;
                return bounds;
            }
            case 'sparkline': {
                bounds.top = canvasY + yOffset - tooltipHeight / 2;
                bounds.left = canvasX + xOffset + 8;
                return bounds;
            }
            case 'sparkline-constrained': {
                bounds.top = canvasY + yOffset - tooltipHeight / 2;
                bounds.left = canvasX + xOffset - 8 - tooltipWidth;
                return bounds;
            }
        }
    }
}
