import type { MessageFormatter } from 'ag-charts-types';
import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
export declare class Locale extends BaseModuleInstance implements ModuleInstance {
    private readonly ctx;
    localeText: Record<string, string> | undefined;
    getLocaleText: MessageFormatter | undefined;
    constructor(ctx: ModuleContext);
}
