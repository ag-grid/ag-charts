import type { AgTooltipRendererResult, InteractionRange, TextWrap } from '../../options/agChartOptions';
import { setAttribute } from '../../util/attributeUtil';
import { getWindow } from '../../util/dom';
import { clamp } from '../../util/number';
import { type Bounds, calculatePlacement } from '../../util/placement';
import { BaseProperties } from '../../util/properties';
import { ObserveChanges } from '../../util/proxy';
import {
    BOOLEAN,
    INTERACTION_RANGE,
    NUMBER,
    OBJECT,
    POSITIVE_NUMBER,
    STRING,
    TEXT_WRAP,
    UNION,
    Validate,
} from '../../util/validation';
import type { DOMManager } from '../dom/domManager';
import type { PointerOffsets } from '../interaction/interactionManager';

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
    | 'bottom-left';

export type TooltipEventType = 'hover' | 'keyboard';
export type TooltipPointerEvent<T extends TooltipEventType> = PointerOffsets & {
    type: T;
    relatedElement?: HTMLElement;
    targetElement?: HTMLElement;
};

export type TooltipMeta = PointerOffsets & {
    showArrow?: boolean;
    lastPointerEvent?: TooltipPointerEvent<TooltipEventType>;
    position?: {
        type?: TooltipPositionType;
        xOffset?: number;
        yOffset?: number;
    };
    enableInteraction?: boolean;
};

export type TooltipContent = {
    html: string;
    ariaLabel: string;
};

export const EMPTY_TOOLTIP_CONTENT: Readonly<TooltipContent> = { html: '', ariaLabel: '' };

function toAccessibleText(inputHtml: string): string {
    const lineConverter = (_match: unknown, offset: number, str: string) => {
        if (offset === 0 || str[offset - 1] !== '.') {
            return '. ';
        }
        return ' ';
    };
    return inputHtml
        .replace(/<br\s*\/?>/g, lineConverter)
        .replace(/<\/p\s+>/g, lineConverter)
        .replace(/<\/li\s*>/g, lineConverter)
        .replace(/<[^>]+>/g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ');
}

export function toTooltipHtml(
    input: string | AgTooltipRendererResult,
    defaults?: AgTooltipRendererResult
): TooltipContent {
    if (typeof input === 'string') {
        return { html: input, ariaLabel: input };
    }

    const {
        content = defaults?.content ?? '',
        title = defaults?.title,
        color = defaults?.color ?? 'white',
        backgroundColor = defaults?.backgroundColor ?? '#888',
    } = input;

    const titleHtml = title
        ? `<div class="${DEFAULT_TOOLTIP_CLASS}-title"
        style="color: ${color}; background-color: ${backgroundColor}">${title}</div>`
        : '';
    const titleAria = title ? `${title}: ` : '';

    const contentHtml = content ? `<div class="${DEFAULT_TOOLTIP_CLASS}-content">${content}</div>` : '';

    return {
        html: `${titleHtml}${contentHtml}`,
        ariaLabel: toAccessibleText(`${titleAria}${content}`),
    };
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

    @ObserveChanges<Tooltip>((target, newValue, oldValue) => {
        if (newValue) {
            target.element?.classList.add(newValue);
        }
        if (oldValue) {
            target.element?.classList.remove(oldValue);
        }
    })
    @Validate(STRING, { optional: true })
    class?: string;

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

    @Validate(BOOLEAN)
    nestedDOM = true;

    private enableInteraction: boolean = false;
    private lastVisibilityChange: number = Date.now();
    private readonly wrapTypes = ['always', 'hyphenate', 'on-space', 'never'];

    private element?: HTMLElement;

    private showTimeout: NodeJS.Timeout | number = 0;
    private _showArrow = true;

    get interactive() {
        return this.enableInteraction;
    }

    constructor() {
        super();
    }

    setup(domManager: DOMManager) {
        this.element = domManager.addChild('canvas-overlay', DEFAULT_TOOLTIP_CLASS);
        this.element.classList.add(DEFAULT_TOOLTIP_CLASS);
        setAttribute(this.element, 'aria-hidden', true);
    }

    destroy(domManager: DOMManager) {
        domManager.removeChild('canvas-overlay', DEFAULT_TOOLTIP_CLASS);
    }

    isVisible(): boolean {
        return !this.element?.classList.contains(DEFAULT_TOOLTIP_CLASS + '-hidden');
    }

    /**
     * Shows tooltip at the given event's coordinates.
     * If the `html` parameter is missing, moves the existing tooltip to the new position.
     */
    show(canvasRect: DOMRect, meta: TooltipMeta, content?: TooltipContent | null, instantly = false) {
        const { element } = this;

        if (content != null && element != null) {
            element.innerHTML = content.html;
        } else if (!element?.innerHTML) {
            this.toggle(false);
            return;
        }

        const positionType = meta.position?.type ?? this.position.type;
        const xOffset = meta.position?.xOffset ?? 0;
        const yOffset = meta.position?.yOffset ?? 0;

        const tooltipBounds = this.getTooltipBounds({ positionType, meta, yOffset, xOffset, canvasRect });

        const position = calculatePlacement(
            element.clientWidth,
            element.clientHeight,
            canvasRect.width,
            canvasRect.height,
            tooltipBounds
        );

        const windowBounds = this.nestedDOM ? canvasRect : this.getWindowSize();
        const minX = this.nestedDOM ? 0 : -canvasRect.left;
        const minY = this.nestedDOM ? 0 : -canvasRect.top;

        const maxX = windowBounds.width - element.clientWidth - 1 + minX;
        const maxY = windowBounds.height - element.clientHeight + minY;

        const left = clamp(minX, position.x, maxX);
        const top = clamp(minY, position.y, maxY);

        const constrained = left !== position.x || top !== position.y;
        const defaultShowArrow =
            (positionType === 'node' || positionType === 'pointer') && !constrained && !xOffset && !yOffset;
        const showArrow = meta.showArrow ?? this.showArrow ?? defaultShowArrow;
        this.updateShowArrow(showArrow);

        element.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;

        this.enableInteraction = meta.enableInteraction ?? false;

        if (this.delay > 0 && !instantly) {
            this.toggle(false);
            this.showTimeout = setTimeout(() => {
                this.toggle(true);
            }, this.delay);
        } else {
            this.toggle(true);
        }
    }

    private getWindowSize() {
        const { innerWidth, innerHeight } = getWindow();
        return { width: innerWidth, height: innerHeight };
    }

    toggle(visible: boolean) {
        if (!this.element) return;

        const { classList } = this.element;
        const toggleClass = (name: string, include: boolean) =>
            classList.toggle(`${DEFAULT_TOOLTIP_CLASS}-${name}`, include);

        const wasVisible = this.isVisible();
        let timeSinceLastVisibilityChangeMs = Infinity;

        if (!visible) {
            clearTimeout(this.showTimeout);
        }

        if (wasVisible !== visible) {
            const now = Date.now();
            timeSinceLastVisibilityChangeMs = now - this.lastVisibilityChange;
            this.lastVisibilityChange = now;
        }

        // Time below which an animated move should be used.
        const animatedMoveThresholdMs = 100;
        // Time below which we should treat updates as indistinguishable to users, and we shouldn't
        // adjust the `no-animation` CSS class.
        const thrashingThresholdMs = 5;

        // No animation on first show or if tooltip is disabled for a non-trivial amount of time.
        // Don't change the `no-animation` class on fast update.
        const noAnimation = !wasVisible && visible && timeSinceLastVisibilityChangeMs > animatedMoveThresholdMs;
        if (timeSinceLastVisibilityChangeMs > thrashingThresholdMs) {
            toggleClass('no-animation', noAnimation);
        }

        toggleClass('no-interaction', !this.enableInteraction); // Prevent interaction.
        toggleClass('hidden', !visible); // Hide if not visible.
        toggleClass('arrow', this._showArrow); // Add arrow if tooltip is constrained.

        classList.toggle(DEFAULT_TOOLTIP_DARK_CLASS, this.darkTheme);

        for (const wrapType of this.wrapTypes) {
            classList.toggle(`${DEFAULT_TOOLTIP_CLASS}-wrap-${wrapType}`, wrapType === this.wrapping);
        }
    }

    private updateShowArrow(show: boolean) {
        this._showArrow = show;
    }

    private getTooltipBounds(opts: {
        positionType: TooltipPositionType;
        meta: TooltipMeta;
        yOffset: number;
        xOffset: number;
        canvasRect: DOMRect;
    }): Bounds {
        if (!this.element) return {};

        const { positionType, meta, yOffset, xOffset, canvasRect } = opts;

        const { clientWidth: tooltipWidth, clientHeight: tooltipHeight } = this.element;
        const bounds: Bounds = { width: tooltipWidth, height: tooltipHeight };

        switch (positionType) {
            case 'node':
            case 'pointer': {
                bounds.top = meta.offsetY + yOffset - tooltipHeight - 8;
                bounds.left = meta.offsetX + xOffset - tooltipWidth / 2;
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
        }
    }
}
