import { describe } from 'vitest';

import { describeGlowSeries, useGlowCharts } from 'ag-charts-community-test';

import { ENTERPRISE_GLOW_SERIES } from '../test/glowSeriesCases';
import { createEnterpriseChart } from '../test/utils';

describe('shadow and glow render (enterprise series)', () => {
    const charts = useGlowCharts(createEnterpriseChart);

    describeGlowSeries(ENTERPRISE_GLOW_SERIES, charts);
});
