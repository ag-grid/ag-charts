import { type BaseAttributeTypeMap, setAttribute } from 'ag-charts-core';
import type { AgIconName } from 'ag-charts-types';

import type { LocaleManager } from '../../locale/localeManager';
import { getIconClassNames } from '../../util/dom';
import { ButtonWidget } from '../../widget/buttonWidget';

export interface ToolbarButtonWidgetOptions {
    icon?: AgIconName;
    label?: string;
    ariaLabel?: string;
    tooltip?: string;
    haspopup: BaseAttributeTypeMap['aria-haspopup'];
}

export class ToolbarButtonWidget extends ButtonWidget {
    public section?: string;

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

        if (options.label != null) {
            const label = localeManager.t(options.label);
            innerHTML = `${innerHTML}<span class="ag-charts-toolbar__label">${label}</span>`;
        }

        if (options.haspopup == null || options.haspopup == 'false') {
            this.setAriaHasPopup(undefined);
            this.setAriaExpanded(undefined);
        } else {
            this.setAriaHasPopup(options.haspopup);
            this.setAriaExpanded(false);
        }

        this.elem.innerHTML = innerHTML;
    }

    public setChecked(checked: boolean) {
        setAttribute(this.elem, 'aria-checked', checked);
    }
}
