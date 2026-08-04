import { describe, it } from 'vitest';

import { expectSharedOptionsDefs } from 'ag-charts-community-test';
import { commonChartOptionsDefs } from 'ag-charts-core';

import { GradientLegendModule } from './gradientLegendModule';

describe('GradientLegendModule', () => {
    it('shares its options schema with commonChartOptionsDefs', () => {
        expectSharedOptionsDefs('gradientLegend', GradientLegendModule.options, commonChartOptionsDefs.gradientLegend);
    });
});
