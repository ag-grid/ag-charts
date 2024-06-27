import type { MessageFormatter } from 'ag-charts-types';

import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import { ObserveChanges } from '../../util/proxy';
import { FUNCTION, PLAIN_OBJECT, Validate } from '../../util/validation';

export class Locale extends BaseModuleInstance implements ModuleInstance {
    @ObserveChanges<Locale>((target) => {
        target.ctx.localeManager.setLocaleText(target.localeText);
    })
    @Validate(PLAIN_OBJECT, { optional: true })
    localeText: Record<string, string> | undefined = undefined;

    @ObserveChanges<Locale>((target) => {
        target.ctx.localeManager.setLocaleTextFormatter(target.getLocaleText);
    })
    @Validate(FUNCTION, { optional: true })
    getLocaleText: MessageFormatter | undefined;

    constructor(private readonly ctx: ModuleContext) {
        super();
    }
}
