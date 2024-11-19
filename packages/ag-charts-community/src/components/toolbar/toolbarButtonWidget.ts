import type { AgIconName } from 'ag-charts-types';

import type { ModuleContext } from '../../module/moduleContext';
import { getIconClassNames } from '../../util/dom';
import { ButtonWidget } from '../../widget/buttonWidget';

export interface ToolbarButtonWidgetOptions {
    icon?: AgIconName;
    label?: string;
    ariaLabel?: string;
    tooltip?: string;
}

export class ToolbarButtonWidget extends ButtonWidget {
    constructor(private readonly ctx: ModuleContext) {
        super();
    }

    public update(options: ToolbarButtonWidgetOptions) {
        const { localeManager } = this.ctx;

        const element = this.getElement();
        element.textContent = options.label ? localeManager.t(options.label) : null;

        if (options.tooltip) {
            element.title = localeManager.t(options.tooltip);
        }

        let innerHTML = '';

        if (options.icon != null) {
            innerHTML = `<span class="${getIconClassNames(options.icon)} ag-charts-toolbar__icon"></span>`;
        }

        if (options.label != null) {
            const label = localeManager.t(options.label);
            innerHTML = `${innerHTML}<span class="ag-charts-toolbar__label">${label}</span>`;
        }

        element.innerHTML = innerHTML;
    }
}
