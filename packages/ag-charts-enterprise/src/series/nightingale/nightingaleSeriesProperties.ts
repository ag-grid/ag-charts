import { AgNightingaleSeriesOptions, _ModuleSupport } from 'ag-charts-community';

import { RadialColumnSeriesBaseProperties } from '../radial-column/radialColumnSeriesBaseProperties';

const { Validate, POSITIVE_NUMBER } = _ModuleSupport;

export class NightingaleSeriesProperties extends RadialColumnSeriesBaseProperties<AgNightingaleSeriesOptions> {
    @Validate(POSITIVE_NUMBER)
    cornerRadius: number = 0;
}
