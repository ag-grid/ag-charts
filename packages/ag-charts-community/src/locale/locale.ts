import { AbstractModuleInstance, Property } from 'ag-charts-core';
import type { Formatter, MessageFormatterParams } from 'ag-charts-types';

import type { ModuleContext } from '../module/moduleContext';
import { ObserveChanges } from '../util/proxy';

export class Locale extends AbstractModuleInstance {
    @ObserveChanges<Locale>((target) => {
        target.ctx.localeManager.setLocaleText(target.localeText);
    })
    @Property
    localeText: Record<string, string> | undefined = undefined;

    @ObserveChanges<Locale>((target) => {
        target.ctx.localeManager.setLocaleTextFormatter(target.getLocaleText);
    })
    @Property
    getLocaleText: Formatter<MessageFormatterParams> | undefined;

    constructor(private readonly ctx: ModuleContext) {
        super();
    }
}
