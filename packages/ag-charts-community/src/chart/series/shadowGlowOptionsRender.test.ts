import { describe } from 'vitest';

import { COMMUNITY_GLOW_SERIES, glowCaseNamed } from '../test/glowCases';
import { RENDER_OPTIONS, ROOM } from '../test/glowRender';
import { describeGlowOptions, useGlowCharts } from '../test/glowRenderSuite';
import { createChart } from '../test/utils';

// Headroom around the bars, for a shadow or a glow to be drawn in.
const HEADROOM = { ...RENDER_OPTIONS, axes: { y: { type: 'number', min: 0, max: 12 } } };

describe('shadow and glow options render', () => {
    describeGlowOptions(
        [
            { testCase: glowCaseNamed(COMMUNITY_GLOW_SERIES, 'bar'), options: HEADROOM },
            {
                testCase: glowCaseNamed(COMMUNITY_GLOW_SERIES, 'scatter'),
                options: ROOM,
                edgeBudget: { series: 1500, hovered: 900 },
            },
            {
                testCase: glowCaseNamed(COMMUNITY_GLOW_SERIES, 'donut'),
                options: ROOM,
                edgeBudget: { series: 46000, hovered: 35000 },
            },
        ],
        useGlowCharts(createChart)
    );
});
