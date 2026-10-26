import {
    type BaseAttributeTypeMap,
    ButtonWidget,
    getIconClassNames,
    hasNoModifiers,
    setAttribute,
} from 'ag-charts-core';
import type { KeyboardClickBindingPredicate, KeyboardWidgetEvent } from 'ag-charts-core';
import type {
    AgAnnotationOptionsToolbarButtonValue,
    AgAnnotationOptionsToolbarSwitchValue,
    AgAnnotationsToolbarButtonValue,
    AgIconName,
    AgIconPosition,
    AgRangesButtonValue,
    AgTimeIntervalUnit,
    AgZoomButtonValue,
} from 'ag-charts-types';

import type { LocaleManager } from '../../locale/localeManager';

type ButtonValue =
    | 'menu'
    | AgAnnotationsToolbarButtonValue
    | AgAnnotationOptionsToolbarButtonValue
    | AgAnnotationOptionsToolbarSwitchValue
    | AgZoomButtonValue
    | AgRangesButtonValue
    | AgTimeIntervalUnit;

export interface ToolbarButtonWidgetOptions {
    icon?: AgIconName;
    iconPosition?: AgIconPosition;
    label?: string;
    ariaLabel?: string;
    tooltip?: string;
    value: ButtonValue;
    buttonSize?: number;
}

export interface ToolbarButtonInteractionOptions {
    isRtl: boolean;
    buttonSize?: number;
    /** The toolbar's unsized button size, at which icons are drawn at their natural size. */
    defaultButtonSize?: number;
}

const DEFAULT_BUTTON_SIZE = 34;
const ICON_SIZE = 20;

export function getToolbarIconSize(buttonSize: number, defaultButtonSize: number = DEFAULT_BUTTON_SIZE): number {
    const size = Math.round(buttonSize);
    // A whole-pixel inset keeps the icon centred on the pixel grid at any button size.
    const inset = Math.round((size * (1 - ICON_SIZE / defaultButtonSize)) / 2);
    return Math.max(0, size - 2 * inset);
}

type ButtonValueHasPopupRule = { readonly [K in Extract<ButtonValue, string>]: BaseAttributeTypeMap['aria-haspopup'] };
const ARIA_HASPOPUP = {
    'disjoint-channel': 'false',
    'fibonacci-menu': 'menu',
    'fibonacci-retracement': 'false',
    'fibonacci-retracement-trend-based': 'false',
    'fill-color': 'dialog',
    'horizontal-line': 'false',
    'line-color': 'dialog',
    'line-menu': 'menu',
    'line-stroke-width': 'menu',
    'line-style-type': 'menu',
    'measurer-menu': 'menu',
    'pan-end': 'false',
    'pan-left': 'false',
    'pan-right': 'false',
    'pan-start': 'false',
    'parallel-channel': 'false',
    'shape-menu': 'menu',
    'text-color': 'dialog',
    'text-menu': 'menu',
    'text-size': 'menu',
    'vertical-line': 'false',
    'zoom-in': 'false',
    'zoom-out': 'false',
    callout: 'false',
    clear: 'false',
    comment: 'false',
    delete: 'false',
    line: 'false',
    lock: 'false',
    menu: 'menu',
    note: 'false',
    reset: 'false',
    settings: 'dialog',
    text: 'false',
    millisecond: 'false',
    second: 'false',
    minute: 'false',
    hour: 'false',
    day: 'false',
    month: 'false',
    year: 'false',
} as const satisfies ButtonValueHasPopupRule;

function getAriaHasPopupOfValue(value: ButtonValue): BaseAttributeTypeMap['aria-haspopup'] {
    if (typeof value !== 'string') return 'false'; // value is AgRangesButtonValue
    return ARIA_HASPOPUP[value];
}

function isArrowLeftPredicate(widgetEvent: KeyboardWidgetEvent): boolean {
    return hasNoModifiers(widgetEvent.sourceEvent) && widgetEvent.sourceEvent.code === 'ArrowLeft';
}

function isArrowRightPredicate(widgetEvent: KeyboardWidgetEvent): boolean {
    return hasNoModifiers(widgetEvent.sourceEvent) && widgetEvent.sourceEvent.code === 'ArrowRight';
}

function falsePredicate(_widgetEvent: KeyboardWidgetEvent): boolean {
    return false;
}

export class ToolbarButtonWidget extends ButtonWidget {
    public section?: string;
    private lastInnerHTML?: string;
    private lastTooltip?: string;
    private lastButtonSize?: number;
    private lastIconSize?: number;
    private arrowKeyPredicate: KeyboardClickBindingPredicate = falsePredicate;

    constructor(
        private readonly localeManager: LocaleManager,
        opensWithArrowKey: boolean
    ) {
        super();
        if (opensWithArrowKey) {
            this.addKeyboardClickBinding((ev) => this.arrowKeyPredicate(ev));
        }
    }

    public update(options: ToolbarButtonWidgetOptions, interactionOptions: ToolbarButtonInteractionOptions) {
        const { localeManager } = this;

        if (options.tooltip != null) {
            const tooltip = localeManager.t(options.tooltip);
            if (tooltip !== this.lastTooltip) {
                this.elem.title = tooltip;
                this.lastTooltip = tooltip;
            }
        }

        let innerHTML = '';

        if (options.icon != null && options.iconPosition !== 'after') {
            innerHTML = `<span class="${getIconClassNames(options.icon)} ag-charts-toolbar__icon"></span>`;
        }

        if (options.label != null) {
            const label = localeManager.t(options.label);
            innerHTML = `${innerHTML}<span class="ag-charts-toolbar__label">${label}</span>`;
        }

        if (options.icon != null && options.iconPosition === 'after') {
            innerHTML = `${innerHTML}<span class="${getIconClassNames(options.icon)} ag-charts-toolbar__icon"></span>`;
        }

        const haspopup = getAriaHasPopupOfValue(options.value);
        if (haspopup == 'false') {
            this.setAriaHasPopup(undefined);
            this.setAriaExpanded(undefined);
            this.arrowKeyPredicate = falsePredicate;
        } else {
            this.setAriaHasPopup(haspopup);
            this.setAriaExpanded(false);
            this.arrowKeyPredicate = interactionOptions.isRtl ? isArrowLeftPredicate : isArrowRightPredicate;
        }

        // Only update innerHTML if content changed - avoids HTML parsing and style recalculation
        if (innerHTML !== this.lastInnerHTML) {
            this.elem.innerHTML = innerHTML;
            this.lastInnerHTML = innerHTML;
        }

        this.updateButtonSize(
            options.buttonSize ?? interactionOptions.buttonSize,
            interactionOptions.defaultButtonSize,
            options
        );
    }

    private updateButtonSize(
        buttonSize: number | undefined,
        defaultButtonSize: number | undefined,
        options: ToolbarButtonWidgetOptions
    ) {
        const sized = buttonSize != null;
        this.toggleClass('ag-charts-toolbar__button--sized', sized);
        this.toggleClass(
            'ag-charts-toolbar__button--icon-only',
            sized && options.icon != null && options.label == null
        );

        const iconSize = sized ? getToolbarIconSize(buttonSize, defaultButtonSize) : undefined;
        if (buttonSize === this.lastButtonSize && iconSize === this.lastIconSize) return;
        this.lastButtonSize = buttonSize;
        this.lastIconSize = iconSize;
        setToolbarSizeProperties(this.elem, buttonSize, iconSize);
    }

    public setChecked(checked: boolean) {
        setAttribute(this.elem, 'aria-checked', checked);
    }
}

export function setToolbarSizeProperties(
    elem: HTMLElement,
    buttonSize: number | undefined,
    iconSize: number | undefined
) {
    if (buttonSize == null) {
        elem.style.removeProperty('--toolbar-button-size');
    } else {
        elem.style.setProperty('--toolbar-button-size', `${buttonSize}px`);
    }
    if (iconSize == null) {
        elem.style.removeProperty('--toolbar-icon-size');
    } else {
        elem.style.setProperty('--toolbar-icon-size', `${iconSize}px`);
    }
}
