import { Component, ElementRef, EventEmitter, Input, NgZone, Output, ViewEncapsulation } from '@angular/core';

import {
    AgChartInstance,
    AgChartModule,
    AgChartParams,
    AgCharts as AgChartsAPI,
    AgFinancialChartOptions,
} from 'ag-charts-community';

import { AgChartsBase } from './ag-charts-base';

// noinspection AngularIncorrectTemplateDefinition
@Component({
    selector: 'ag-financial-charts',
    standalone: true,
    template: '',
    encapsulation: ViewEncapsulation.None,
})
export class AgFinancialCharts extends AgChartsBase<AgFinancialChartOptions> {
    @Input()
    public options: AgFinancialChartOptions = {};

    @Input()
    public modules: AgChartModule[] | undefined;

    @Output()
    public chartReady: EventEmitter<AgChartInstance> = new EventEmitter();

    protected readonly selector = 'ag-financial-charts';

    constructor(
        elementDef: ElementRef,
        protected ngZone: NgZone
    ) {
        super();
        this._nativeElement = elementDef.nativeElement;
    }

    protected createChart(options: AgFinancialChartOptions, params: AgChartParams) {
        return AgChartsAPI.createFinancialChart(options, params);
    }
}
