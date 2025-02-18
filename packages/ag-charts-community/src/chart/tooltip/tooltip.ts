import type { InteractionRange, TextWrap, TooltipGrouping } from 'ag-charts-types';

import { getWindow } from '../../core';
import type { DOMManager } from '../../dom/domManager';
import { clamp } from '../../util/number';
import { type Bounds, type Placement, calculatePlacement } from '../../util/placement';
import { BaseProperties } from '../../util/properties';
import { sanitizeHtml } from '../../util/sanitize';
import {
    ARRAY_OF,
    BOOLEAN,
    INTERACTION_RANGE,
    NUMBER,
    OBJECT,
    OR,
    POSITIVE_NUMBER,
    TEXT_WRAP,
    UNION,
    Validate,
} from '../../util/validation';
import { type LegendSymbolOptions, legendSymbolSvg } from '../legend/legendSymbol';
import { SpringAnimation } from './springAnimation';

export const DEFAULT_TOOLTIP_CLASS = 'ag-charts-tooltip';
export const DEFAULT_TOOLTIP_DARK_CLASS = 'ag-charts-tooltip--dark';

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

type TooltipOffsets = { canvasX: number; canvasY: number };
export type TooltipEventType = 'pointermove' | 'click' | 'dblclick' | 'keyboard';
export type TooltipPointerEvent<T extends TooltipEventType = TooltipEventType> = Readonly<TooltipOffsets> & {
    readonly type: T;
};

export interface TooltipMetaPosition {
    affixment?: TooltipAffixment;
    tether?: TooltipTether | TooltipTether[];
    xOffset?: number;
    yOffset?: number;
}

export interface TooltipMeta extends TooltipOffsets {
    showArrow?: boolean;
    lastPointerEvent?: TooltipPointerEvent;
    position?: TooltipMetaPosition;
    enableInteraction?: boolean;
}

export type TooltipContentDataRow =
    | { label: string; fallbackLabel?: string; value: string }
    | { label: undefined; fallbackLabel: string; value: string };

export type TooltipStructuredContent = {
    heading?: string;
    title?: string;
    symbol?: LegendSymbolOptions;
    data?: TooltipContentDataRow[];
};
export type TooltipContent =
    | ({ type: 'structured' } & TooltipStructuredContent)
    | { type: 'raw'; rawHtmlString: string };

interface GroupedStructuredContent {
    heading?: string;
    items: Omit<TooltipStructuredContent, 'heading'>[];
}

type GroupedTooltipContent =
    | ({ type: 'structured' } & GroupedStructuredContent)
    | { type: 'raw'; rawHtmlString: string };

function aggregateTooltipContent(content: TooltipContent[]): GroupedTooltipContent[] {
    const out: GroupedTooltipContent[] = [];
    const groupedContents = new Map<string, GroupedStructuredContent>();
    for (const item of content) {
        if (item.type === 'structured') {
            const { heading } = item;
            const insertionTarget = heading != null ? groupedContents.get(heading) : undefined;
            const groupedItem: GroupedTooltipContent = { type: 'structured', heading, items: [item] };
            if (insertionTarget == null) {
                groupedContents.set(heading!, groupedItem);
                out.push(groupedItem);
            } else {
                insertionTarget.items.push(item);
            }
        } else {
            out.push(item);
        }
    }
    return out;
}

export function tooltipContentAriaLabel(content: TooltipContent) {
    const ariaLabel: string[] = [];

    if (content.type === 'raw') return '';
    if (content.heading != null) ariaLabel.push(content.heading);
    if (content.title != null) ariaLabel.push(content.title);
    content.data?.forEach((datum) => {
        ariaLabel.push(datum.label ?? datum.fallbackLabel, datum.value);
    });

    return ariaLabel.join('; ');
}

function dataHtml(label: string | undefined, value: string, inline: boolean) {
    let rowHtml = '';

    if (label == null) {
        rowHtml += `<span class="${DEFAULT_TOOLTIP_CLASS}-label">${sanitizeHtml(value)}</span>`;
    } else {
        rowHtml += `<span class="${DEFAULT_TOOLTIP_CLASS}-label">${sanitizeHtml(label)}</span>`;
        rowHtml += ' ';
        rowHtml += `<span class="${DEFAULT_TOOLTIP_CLASS}-value">${sanitizeHtml(value)}</span>`;
    }

    const rowClassNames = [`${DEFAULT_TOOLTIP_CLASS}-row`];
    if (inline) rowClassNames.push(`${DEFAULT_TOOLTIP_CLASS}-row--inline`);
    rowHtml = `<div class="${rowClassNames.join(' ')}">${rowHtml}</div>`;

    return rowHtml;
}

function tooltipRowContentHtml(content: GroupedStructuredContent['items'][0]) {
    let html = '';

    const dataInline = content.title == null && content.data?.length === 1;

    const symbol = content.symbol == null ? undefined : legendSymbolSvg(content.symbol, 12);
    if (symbol != null && (content.title != null || content.data?.length)) {
        html += `<span class="${DEFAULT_TOOLTIP_CLASS}-symbol">${symbol}</span>`;
    }

    if (content.title != null) {
        html += `<span class="${DEFAULT_TOOLTIP_CLASS}-title">${sanitizeHtml(content.title)}</span>`;
        html += ' ';
    }

    content.data?.forEach((datum) => {
        html += dataHtml(datum.label ?? datum.fallbackLabel, datum.value, dataInline);
        html += ' ';
    });

    return html;
}

function tooltipContentHtml(content: GroupedTooltipContent) {
    if (content.type === 'raw') return content.rawHtmlString;

    let html = '';

    const singleItem = content.items.length === 1 ? content.items[0] : undefined;

    if (
        singleItem != null &&
        (content.heading == null || singleItem.title == null) &&
        singleItem.data?.length === 1 &&
        singleItem.data[0].label == null &&
        singleItem.data[0].value != null
    ) {
        // Compact rendering
        const datum = singleItem.data[0];

        html += dataHtml(content.heading ?? singleItem.title, datum.value, false);
    } else {
        // Full rendering

        if (content.heading != null) {
            html += `<span class="${DEFAULT_TOOLTIP_CLASS}-heading">${sanitizeHtml(content.heading)}</span>`;
            html += ' ';
        }

        content.items.forEach((item) => {
            html += tooltipRowContentHtml(item);
        });
    }

    html = `<div class="${DEFAULT_TOOLTIP_CLASS}-content">${html.trimEnd()}</div>`;

    return html;
}

const POSITION_TYPE = UNION(
    ['pointer', 'node', 'top', 'right', 'bottom', 'left', 'top-left', 'top-right', 'bottom-right', 'bottom-left'],
    'a position type'
);

export type TooltipAffixment = 'pointer' | 'node' | 'chart';
const AFFIXMENT = UNION(['pointer', 'node', 'chart'], 'an affixment');

export type TooltipTether =
    | 'top'
    | 'right'
    | 'bottom'
    | 'left'
    | 'top-right'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-left'
    | 'center';
const TETHER_UNION = UNION(
    ['top', 'right', 'bottom', 'left', 'top-right', 'bottom-right', 'bottom-left', 'top-left', 'center'],
    'a tether'
);
const TETHER = OR(TETHER_UNION, ARRAY_OF(TETHER_UNION));

export class TooltipPosition extends BaseProperties {
    @Validate(POSITION_TYPE)
    /** The type of positioning for the tooltip. By default, the tooltip follows the pointer. */
    type: TooltipPositionType = 'pointer';

    @Validate(NUMBER)
    /** The horizontal offset in pixels for the position of the tooltip. */
    xOffset: number = 0;

    @Validate(NUMBER)
    /** The vertical offset in pixels for the position of the tooltip. */
    yOffset: number = 0;

    @Validate(AFFIXMENT, { optional: true })
    affixment?: TooltipAffixment;

    @Validate(TETHER, { optional: true })
    tether?: TooltipTether | TooltipTether[];

    get defaultAffixment(): TooltipAffixment {
        const { type } = this;
        if (type === 'node' || type === 'pointer') {
            return type;
        } else {
            return 'chart';
        }
    }

    get defaultTether(): TooltipTether {
        const { type } = this;
        if (type === 'node' || type === 'pointer') {
            return 'top';
        } else {
            return type;
        }
    }
}

const horizontalAlignments: Record<TooltipTether, -1 | 0 | 1> = {
    left: -1,
    'top-left': -1,
    'bottom-left': -1,
    top: 0,
    center: 0,
    bottom: 0,
    right: 1,
    'top-right': 1,
    'bottom-right': 1,
};

const verticalAlignments: Record<TooltipTether, -1 | 0 | 1> = {
    'top-left': -1,
    top: -1,
    'top-right': -1,
    left: 0,
    center: 0,
    right: 0,
    'bottom-left': 1,
    bottom: 1,
    'bottom-right': 1,
};

enum ArrowPosition {
    Left,
    Top,
    Bottom,
    Right,
}

const arrowPositions: Record<TooltipTether, ArrowPosition | undefined> = {
    left: ArrowPosition.Right,
    'top-left': undefined,
    'bottom-left': undefined,
    top: ArrowPosition.Bottom,
    center: undefined,
    bottom: ArrowPosition.Top,
    right: ArrowPosition.Left,
    'top-right': undefined,
    'bottom-right': undefined,
};

enum DirectionCheck {
    Horizontal = 0b01,
    Vertical = 0b10,
    Both = 0b11,
    None = 0b00,
}

const directionChecks: Record<TooltipTether, DirectionCheck> = {
    top: DirectionCheck.Vertical,
    bottom: DirectionCheck.Vertical,
    left: DirectionCheck.Horizontal,
    right: DirectionCheck.Horizontal,
    'top-right': DirectionCheck.Both,
    'top-left': DirectionCheck.Both,
    'bottom-right': DirectionCheck.Both,
    'bottom-left': DirectionCheck.Both,
    center: DirectionCheck.None,
};

const TOOLTIP_GROUPING = UNION(['none', 'category']);

export class Tooltip extends BaseProperties {
    @Validate(BOOLEAN)
    enabled: boolean = true;

    @Validate(TOOLTIP_GROUPING)
    grouping: TooltipGrouping = 'none';

    @Validate(BOOLEAN, { optional: true })
    showArrow?: boolean;

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

    /** Undocumented sparkline option */
    @Validate(BOOLEAN)
    compact = false;

    private readonly destroyFns: Array<() => void> = [];
    private readonly springAnimation = new SpringAnimation();

    private enableInteraction: boolean = false;
    private readonly wrapTypes = ['always', 'hyphenate', 'on-space', 'never'];

    private element?: HTMLElement;

    private showTimeout: NodeJS.Timeout | number = 0;
    private _arrowPosition: ArrowPosition | undefined = undefined;
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
            this.element.className = DEFAULT_TOOLTIP_CLASS;
        }
    }

    destroy(domManager: DOMManager) {
        domManager.removeChild('canvas-overlay', DEFAULT_TOOLTIP_CLASS);
        this.destroyFns.forEach((f) => f());
    }

    isVisible(): boolean {
        return this._visible;
    }

    contains(node: Node | null): boolean {
        return this.element?.contains(node) ?? false;
    }

    private updateTooltipPosition() {
        const { element, positionParams } = this;
        if (element == null || positionParams == null) return;

        const { canvasRect, relativeRect, meta } = positionParams;
        const { x: canvasX, y: canvasY } = this.springAnimation;

        let tethers = meta.position?.tether ?? this.position.tether ?? this.position.defaultTether;
        const affixment = meta.position?.affixment ?? this.position.affixment ?? this.position.defaultAffixment;
        const xOffset = meta.position?.xOffset ?? 0;
        const yOffset = meta.position?.yOffset ?? 0;

        const minX = relativeRect.x;
        const minY = relativeRect.y;
        const maxX = relativeRect.width - element.clientWidth - 1 + minX;
        const maxY = relativeRect.height - element.clientHeight + minY;

        if (!Array.isArray(tethers)) {
            tethers = [tethers];
        }
        let i = 0;
        let tether: TooltipTether | undefined;
        let position: Placement | undefined;
        let constrained = false;
        do {
            tether = tethers[i];
            i += 1;

            const tooltipBounds = this.getTooltipBounds({
                tether,
                affixment,
                canvasX,
                canvasY,
                yOffset,
                xOffset,
                canvasRect,
            });
            position = calculatePlacement(element.clientWidth, element.clientHeight, relativeRect, tooltipBounds);

            constrained = false;
            if (directionChecks[tether] & DirectionCheck.Horizontal) {
                constrained ||= position.x < minX || position.x > maxX;
            }
            if (directionChecks[tether] & DirectionCheck.Vertical) {
                constrained ||= position.y < minY || position.y > maxY;
            }
        } while (i < tethers.length && constrained);

        const left = clamp(minX, position.x, maxX);
        const top = clamp(minY, position.y, maxY);

        constrained ||= left !== position.x || top !== position.y;
        const defaultShowArrow = affixment !== 'chart' && !constrained && !xOffset && !yOffset;
        const showArrow = meta.showArrow ?? this.showArrow ?? defaultShowArrow;
        const arrowPosition = showArrow ? arrowPositions[tether] : undefined;
        this.updateArrowPosition(arrowPosition);

        element.style.transform = `translate(${left}px, ${top}px)`;

        this.updateClassModifiers();
    }

    /**
     * Shows tooltip at the given event's coordinates.
     * If the `html` parameter is missing, moves the existing tooltip to the new position.
     */
    show(
        boundingRect: DOMRect,
        canvasRect: DOMRect,
        meta: TooltipMeta,
        content?: TooltipContent[] | null,
        instantly = false
    ) {
        const { element } = this;

        if (element != null && content != null && content.length !== 0) {
            element.innerHTML = aggregateTooltipContent(content).map(tooltipContentHtml).join('');
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

        this.updateClassModifiers();

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

        if (!visible) {
            clearTimeout(this.showTimeout);
        }

        this.element.togglePopover(visible);

        if (visible) {
            // We can only measure the element when it's actually visible
            // This removes a possible jump for the tooltip
            this.updateTooltipPosition();
        }
    }

    private updateClassModifiers() {
        if (!this.element?.isConnected) return;

        const { classList } = this.element;

        const toggleClass = (name: string, include: boolean) =>
            classList.toggle(`${DEFAULT_TOOLTIP_CLASS}--${name}`, include);

        toggleClass('no-interaction', !this.enableInteraction); // Prevent interaction.
        toggleClass('arrow-top', this._arrowPosition === ArrowPosition.Top);
        toggleClass('arrow-right', this._arrowPosition === ArrowPosition.Right);
        toggleClass('arrow-bottom', this._arrowPosition === ArrowPosition.Bottom);
        toggleClass('arrow-left', this._arrowPosition === ArrowPosition.Left);
        toggleClass('compact', this.compact);

        classList.toggle(DEFAULT_TOOLTIP_DARK_CLASS, this.darkTheme);

        for (const wrapType of this.wrapTypes) {
            classList.toggle(`${DEFAULT_TOOLTIP_CLASS}--wrap-${wrapType}`, wrapType === this.wrapping);
        }
    }

    private updateArrowPosition(arrowPosition: ArrowPosition | undefined) {
        this._arrowPosition = arrowPosition;
    }

    private getTooltipBounds(opts: {
        affixment: TooltipAffixment;
        tether: TooltipTether;
        canvasX: number;
        canvasY: number;
        yOffset: number;
        xOffset: number;
        canvasRect: DOMRect;
    }): Bounds {
        if (!this.element) return {};

        const { affixment, tether, canvasX, canvasY, yOffset, xOffset, canvasRect } = opts;

        const { clientWidth: tooltipWidth, clientHeight: tooltipHeight } = this.element;
        const bounds: Bounds = { width: tooltipWidth, height: tooltipHeight };

        if (affixment === 'node' || affixment === 'pointer') {
            const horizontalAlignment = horizontalAlignments[tether];
            const verticalAlignment = verticalAlignments[tether];
            bounds.top = canvasY + yOffset + (tooltipHeight * (verticalAlignment - 1)) / 2 + 8 * verticalAlignment;
            bounds.left = canvasX + xOffset + (tooltipWidth * (horizontalAlignment - 1)) / 2 + 8 * horizontalAlignment;
            return bounds;
        }

        switch (tether) {
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

        return bounds;
    }
}
