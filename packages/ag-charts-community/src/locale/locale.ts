import { AbstractModuleInstance, type DynamicContext } from 'ag-charts-core';

import type { ChartRegistry } from '../module/moduleContext';

export class Locale extends AbstractModuleInstance {
    constructor(ctx: DynamicContext<ChartRegistry>) {
        super();
        this.cleanup.register(
            ctx.chartState.observe((get) => {
                ctx.localeManager.setLocaleText(get('options', 'locale.localeText'));
            }),
            ctx.chartState.observe((get) => {
                ctx.localeManager.setLocaleTextFormatter(get('options', 'locale.getLocaleText'));
            })
        );
    }
}
