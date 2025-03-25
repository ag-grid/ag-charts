import type { Formatter, MessageFormatterParams } from 'ag-charts-types';

import type { ModuleInstance } from '../module/baseModule';
import { BaseModuleInstance } from '../module/module';
import type { ModuleContext } from '../module/moduleContext';
import { Property } from '../util/properties';
import { ObserveChanges } from '../util/proxy';

export class Locale extends BaseModuleInstance implements ModuleInstance {
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
