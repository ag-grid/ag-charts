import { describe, it } from 'vitest';

import { commonChartOptionsDefs } from 'ag-charts-core';

import { expectSharedOptionsDefs } from '../test/sharedOptionsDefs';
import { LegendModule } from './legendModule';

describe('LegendModule', () => {
    it('shares its options schema with commonChartOptionsDefs', () => {
        expectSharedOptionsDefs('legend', LegendModule.options, commonChartOptionsDefs.legend);
    });
});
