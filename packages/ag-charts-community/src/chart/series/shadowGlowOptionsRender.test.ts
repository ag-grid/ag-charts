import { describe } from 'vitest';

import { COMMUNITY_GLOW_SERIES } from '../test/glowCases';
import { RENDER_OPTIONS, ROOM } from '../test/glowRender';
import { describeGlowOptions, useGlowCharts } from '../test/glowRenderSuite';
import { createChart } from '../test/utils';

const seriesNamed = (name: string) => COMMUNITY_GLOW_SERIES.find((testCase) => testCase.name === name)!;

// Headroom around the bars, for a shadow or a glow to be drawn in.
const HEADROOM = { ...RENDER_OPTIONS, axes: { y: { type: 'number', min: 0, max: 12 } } };

// A gap of 0 and no gap blend the anti-aliased edge of a marker or a sector differently, by up to 17 of 255.
const EDGE_TOLERANCE = 32;

describe('shadow and glow options render', () => {
    describeGlowOptions(
        [
            { testCase: seriesNamed('bar'), options: HEADROOM },
            { testCase: seriesNamed('scatter'), options: ROOM, edgeTolerance: EDGE_TOLERANCE },
            { testCase: seriesNamed('donut'), options: ROOM, edgeTolerance: EDGE_TOLERANCE },
        ],
        useGlowCharts(createChart)
    );
});
