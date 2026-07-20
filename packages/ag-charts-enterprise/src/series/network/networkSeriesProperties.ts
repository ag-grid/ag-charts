import { _ModuleSupport } from 'ag-charts-community';
import { Property, ProxyOnWrite } from 'ag-charts-core';

export class NetworkSeriesProperties extends _ModuleSupport.SeriesProperties<object> {
    @Property
    readonly tooltip = _ModuleSupport.makeSeriesTooltip<any>();
}

export class NetworkSeriesTreeLayoutProperties extends NetworkSeriesProperties {
    @Property
    direction: string = 'down';

    @Property
    depthSpacing?: number;

    @Property
    innerSpacing?: number;

    @Property
    outerSpacing?: number;

    @Property
    @ProxyOnWrite('depthSpacing')
    verticalSpacing?: number;
}
