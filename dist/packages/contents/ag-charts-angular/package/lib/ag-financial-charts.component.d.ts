import { ElementRef, EventEmitter, NgZone } from '@angular/core';
import { AgChartInstance, AgFinancialChartOptions } from 'ag-charts-community';
import { AgChartsBase } from './ag-charts-base';
import * as i0 from "@angular/core";
export declare class AgFinancialCharts extends AgChartsBase<AgFinancialChartOptions> {
    protected ngZone: NgZone;
    options: AgFinancialChartOptions;
    onChartReady: EventEmitter<AgChartInstance>;
    constructor(elementDef: ElementRef, ngZone: NgZone);
    protected createChart(options: AgFinancialChartOptions): AgChartInstance<AgFinancialChartOptions>;
    static ɵfac: i0.ɵɵFactoryDeclaration<AgFinancialCharts, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<AgFinancialCharts, "ag-financial-charts", never, { "options": { "alias": "options"; "required": false; }; }, { "onChartReady": "onChartReady"; }, never, never, true, never>;
}
