import type { _ModuleSupport } from 'ag-charts-community';
import { AbstractModuleInstance } from 'ag-charts-core';

export class DataSelection extends AbstractModuleInstance {
    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();
        this.ctx; // TODO - unused
    }
}
