import { Component, ElementRef, EventEmitter, Input, NgZone, Output, ViewEncapsulation } from '@angular/core';

import {
    AgChartInstance,
    AgChartModule,
    AgChartParams,
    AgCharts as AgChartsAPI,
    AgQuadrantChartOptions,
} from 'ag-charts-community';

import { AgChartsBase } from './ag-charts-base';

// noinspection AngularIncorrectTemplateDefinition
@Component({
    selector: 'ag-quadrant-chart',
    standalone: true,
    template: '',
    encapsulation: ViewEncapsulation.None,
})
export class AgQuadrantChart extends AgChartsBase<AgQuadrantChartOptions> {
    // Required rather than defaulted: `xKey`/`yKey` have no meaningful placeholder value.
    @Input({ required: true })
    public options!: AgQuadrantChartOptions;

    /** Modules registered for this chart only, in addition to any registered globally. Read when the chart is created. */
    @Input()
    public modules: AgChartModule[] | undefined;

    @Output()
    public chartReady: EventEmitter<AgChartInstance> = new EventEmitter();

    protected readonly selector = 'ag-quadrant-chart';

    constructor(
        elementDef: ElementRef,
        protected ngZone: NgZone
    ) {
        super();
        this._nativeElement = elementDef.nativeElement;
    }

    protected createChart(options: AgQuadrantChartOptions, params: AgChartParams) {
        return AgChartsAPI.createQuadrantChart(options, params);
    }
}
