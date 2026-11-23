import { describe } from 'vitest';

import { type GlowOptionsEntry, ROOM, describeGlowOptions, useGlowCharts } from 'ag-charts-community-test';

import { ENTERPRISE_GLOW_SERIES, HIERARCHY_GLOW_SERIES } from '../test/glowSeriesCases';
import { createEnterpriseChart } from '../test/utils';

const seriesNamed = (name: string) =>
    [...HIERARCHY_GLOW_SERIES, ...ENTERPRISE_GLOW_SERIES].find((testCase) => testCase.name === name)!;

// A gap of 0 and no gap blend the anti-aliased edge of a sector or a flow link differently, by a few of 255.
const EDGE_TOLERANCE = 32;

const ENTRIES: Record<string, Partial<GlowOptionsEntry>> = {
    'treemap tile': { opaquePart: 'tile', noHoveredShadow: true },
    sunburst: { noHoveredShadow: true },
    'sankey nodes': { opaquePart: 'node' },
    'sankey links': { opaquePart: 'link' },
};

describe('shadow and glow options render (enterprise series)', () => {
    describeGlowOptions(
        Object.entries(ENTRIES).map(([name, entry]) => ({
            testCase: seriesNamed(name),
            options: ROOM,
            edgeTolerance: EDGE_TOLERANCE,
            ...entry,
        })),
        useGlowCharts(createEnterpriseChart)
    );
});
