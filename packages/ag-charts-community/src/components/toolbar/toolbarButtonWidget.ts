import { type BaseAttributeTypeMap, getIconClassNames, setAttribute } from 'ag-charts-core';
import type {
    AgAnnotationOptionsToolbarButtonValue,
    AgAnnotationOptionsToolbarSwitchValue,
    AgAnnotationsToolbarButtonValue,
    AgIconName,
    AgRangesButtonValue,
    AgZoomButtonValue,
} from 'ag-charts-types';

import type { LocaleManager } from '../../locale/localeManager';
import { ButtonWidget } from '../../widget/buttonWidget';

type ButtonValue =
    | 'menu'
    | AgAnnotationsToolbarButtonValue
    | AgAnnotationOptionsToolbarButtonValue
    | AgAnnotationOptionsToolbarSwitchValue
    | AgZoomButtonValue
    | AgRangesButtonValue;

export interface ToolbarButtonWidgetOptions {
    icon?: AgIconName;
    label?: string;
    ariaLabel?: string;
    tooltip?: string;
    value: ButtonValue;
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
} as const satisfies ButtonValueHasPopupRule;

function getAriaHasPopupOfValue(value: ButtonValue): BaseAttributeTypeMap['aria-haspopup'] {
    if (typeof value !== 'string') return 'false'; // value is AgRangesButtonValue
    return ARIA_HASPOPUP[value];
}

export class ToolbarButtonWidget extends ButtonWidget {
    public section?: string;
    private lastInnerHTML?: string;
    private lastTooltip?: string;

    constructor(private readonly localeManager: LocaleManager) {
        super();
    }

    public update(options: ToolbarButtonWidgetOptions) {
        const { localeManager } = this;

        if (options.tooltip) {
            const tooltip = localeManager.t(options.tooltip);
            if (tooltip !== this.lastTooltip) {
                this.elem.title = tooltip;
                this.lastTooltip = tooltip;
            }
        }

        let innerHTML = '';

        if (options.icon != null) {
            innerHTML = `<span class="${getIconClassNames(options.icon)} ag-charts-toolbar__icon"></span>`;
        }

        if (options.label != null) {
            const label = localeManager.t(options.label);
            innerHTML = `${innerHTML}<span class="ag-charts-toolbar__label">${label}</span>`;
        }

        const haspopup = getAriaHasPopupOfValue(options.value);
        if (haspopup == 'false') {
            this.setAriaHasPopup(undefined);
            this.setAriaExpanded(undefined);
        } else {
            this.setAriaHasPopup(haspopup);
            this.setAriaExpanded(false);
        }

        // Only update innerHTML if content changed - avoids HTML parsing and style recalculation
        if (innerHTML !== this.lastInnerHTML) {
            this.elem.innerHTML = innerHTML;
            this.lastInnerHTML = innerHTML;
        }
    }

    public setChecked(checked: boolean) {
        setAttribute(this.elem, 'aria-checked', checked);
    }
}
