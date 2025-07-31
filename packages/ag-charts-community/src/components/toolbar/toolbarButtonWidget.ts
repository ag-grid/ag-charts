import { type ElementID, createElementId, setAttribute } from 'ag-charts-core';
import type { AgIconName } from 'ag-charts-types';

import type { LocaleManager } from '../../locale/localeManager';
import { getIconClassNames } from '../../util/dom';
import { ButtonWidget } from '../../widget/buttonWidget';

export interface ToolbarButtonWidgetOptions {
    icon?: AgIconName;
    label?: string;
    ariaValue?: string;
    tooltip?: string;
}

export class ToolbarButtonWidget extends ButtonWidget {
    public section?: string;
    private valueID?: ElementID;
    private labelID?: ElementID;

    constructor(private readonly localeManager: LocaleManager) {
        super();
    }

    public update(options: ToolbarButtonWidgetOptions) {
        const { localeManager } = this;

        if (options.tooltip) {
            this.elem.title = localeManager.t(options.tooltip);
        }

        let innerHTML = '';

        if (options.icon != null) {
            innerHTML = `<span class="${getIconClassNames(options.icon)} ag-charts-toolbar__icon"></span>`;
        }

        if (options.ariaValue != null && options.label != null) {
            this.labelID ??= createElementId();
            this.valueID ??= createElementId();
            this.elem.setAttribute('aria-labelledby', `${this.labelID} ${this.valueID}`);

            const label = localeManager.t(options.label);
            const labelHTML = `<span id=${this.labelID} style="display: none">${label},</span>`;
            const valueHTML = `<span id=${this.valueID} class="ag-charts-toolbar__label">${options.ariaValue}</span>`;
            innerHTML = `${innerHTML}${labelHTML}${valueHTML}`;
        } else if (options.label != null) {
            const label = localeManager.t(options.label);
            innerHTML = `${innerHTML}<span class="ag-charts-toolbar__label">${label}</span>`;
        }

        this.elem.innerHTML = innerHTML;
    }

    public setChecked(checked: boolean) {
        setAttribute(this.elem, 'aria-checked', checked);
    }
}
