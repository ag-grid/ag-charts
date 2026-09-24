import { Component, ElementRef, EventEmitter, Input, NgZone, Output, ViewEncapsulation } from '@angular/core';

import {
    AgChartInstance,
    AgChartModule,
    AgChartParams,
    AgCharts as AgChartsAPI,
    AgGaugeOptions,
} from 'ag-charts-community';

import { AgChartsBase } from './ag-charts-base';

// noinspection AngularIncorrectTemplateDefinition
@Component({
    selector: 'ag-gauge',
    standalone: true,
    template: '',
    encapsulation: ViewEncapsulation.None,
})
export class AgGauge extends AgChartsBase<AgGaugeOptions> {
    @Input()
    public options: AgGaugeOptions = { type: 'radial-gauge', value: 0 };

    /** Modules registered for this chart only, in addition to any registered globally. Read when the chart is created. */
    @Input()
    public modules: AgChartModule[] | undefined;

    @Output()
    public chartReady: EventEmitter<AgChartInstance> = new EventEmitter();

    protected readonly selector = 'ag-gauge';

    constructor(
        elementDef: ElementRef,
        protected ngZone: NgZone
    ) {
        super();
        this._nativeElement = elementDef.nativeElement;
    }

    protected createChart(options: AgGaugeOptions, params: AgChartParams) {
        return AgChartsAPI.createGauge(options, params);
    }
}
