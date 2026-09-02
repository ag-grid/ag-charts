import { Component, ElementRef, EventEmitter, Input, NgZone, Output, ViewEncapsulation } from '@angular/core';

import {
    AgChartInstance,
    AgChartModule,
    AgChartOptions,
    AgChartParams,
    AgCharts as AgChartsAPI,
} from 'ag-charts-community';

import { AgChartsBase } from './ag-charts-base';

// noinspection AngularIncorrectTemplateDefinition
@Component({
    selector: 'ag-charts',
    standalone: true,
    template: '',
    encapsulation: ViewEncapsulation.None,
})
export class AgCharts extends AgChartsBase<AgChartOptions> {
    @Input()
    public options: AgChartOptions = {};

    @Input()
    public modules: AgChartModule[] | undefined;

    @Output()
    public chartReady: EventEmitter<AgChartInstance> = new EventEmitter();

    protected readonly selector = 'ag-charts';

    constructor(
        elementDef: ElementRef,
        protected ngZone: NgZone
    ) {
        super();
        this._nativeElement = elementDef.nativeElement;
    }

    protected createChart(options: AgChartOptions, params: AgChartParams) {
        return AgChartsAPI.create(options, params);
    }
}
