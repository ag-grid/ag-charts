import { Component, ElementRef, EventEmitter, Input, NgZone, Output, ViewEncapsulation } from '@angular/core';

import {
    AgChartInstance,
    AgChartModule,
    AgChartParams,
    AgCharts as AgChartsAPI,
    AgVolumeProfileChartOptions,
} from 'ag-charts-community';

import { AgChartsBase } from './ag-charts-base';

// noinspection AngularIncorrectTemplateDefinition
@Component({
    selector: 'ag-volume-profile-chart',
    standalone: true,
    template: '',
    encapsulation: ViewEncapsulation.None,
})
export class AgVolumeProfileChart extends AgChartsBase<AgVolumeProfileChartOptions> {
    // Required rather than defaulted: `upKey`/`downKey` have no meaningful placeholder value.
    @Input({ required: true })
    public options!: AgVolumeProfileChartOptions;

    /** Modules registered for this chart only, in addition to any registered globally. Read when the chart is created. */
    @Input()
    public modules: AgChartModule[] | undefined;

    @Output()
    public chartReady: EventEmitter<AgChartInstance> = new EventEmitter();

    protected readonly selector = 'ag-volume-profile-chart';

    constructor(
        elementDef: ElementRef,
        protected ngZone: NgZone
    ) {
        super();
        this._nativeElement = elementDef.nativeElement;
    }

    protected createChart(options: AgVolumeProfileChartOptions, params: AgChartParams) {
        return AgChartsAPI.createVolumeProfileChart(options, params);
    }
}
