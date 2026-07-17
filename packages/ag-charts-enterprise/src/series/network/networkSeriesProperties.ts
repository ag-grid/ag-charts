import {
    type AgNetworkSeriesTreeLayoutAlignment,
    type AgNetworkSeriesTreeLayoutDirection,
    _ModuleSupport,
} from 'ag-charts-community';
import { DeprecatedAndRenamedTo, Property } from 'ag-charts-core';

export class NetworkSeriesProperties extends _ModuleSupport.SeriesProperties<object> {
    @Property
    readonly tooltip = _ModuleSupport.makeSeriesTooltip<any>();
}

export class NetworkSeriesTreeLayoutProperties extends NetworkSeriesProperties {
    @Property
    alignment: AgNetworkSeriesTreeLayoutAlignment = 'center-all-children';

    @Property
    direction: AgNetworkSeriesTreeLayoutDirection = 'down';

    @Property
    innerSpacing?: number;

    @Property
    layerSpacing?: number;

    @Property
    outerSpacing?: number;

    @Property
    @DeprecatedAndRenamedTo('layerSpacing')
    verticalSpacing?: number;
}
