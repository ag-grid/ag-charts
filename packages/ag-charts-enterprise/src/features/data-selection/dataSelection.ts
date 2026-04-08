import type { _ModuleSupport } from 'ag-charts-community';
import { AbstractModuleInstance, Property } from 'ag-charts-core';

export class DataSelection extends AbstractModuleInstance {
    @Property
    enabled: boolean = false;

    @Property
    enableClick: boolean = true;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();
        this.ctx; // TODO - unused
    }
}
