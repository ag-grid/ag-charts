import { describe } from 'vitest';

import {
    type GlowOptionsEntry,
    ROOM,
    describeGlowOptions,
    glowCaseNamed,
    useGlowCharts,
} from 'ag-charts-community-test';

import { ENTERPRISE_GLOW_SERIES, HIERARCHY_GLOW_SERIES } from '../test/glowSeriesCases';
import { createEnterpriseChart } from '../test/utils';

// The neutral-fill series glow flush by default (a gap of 0), where the gap cells of the suite compare a gap with the default
// gap of 1 of the others. Their theme gets that gap of 1, which their highlight glows follow, so those cells compare as written.
const GAP_OF_ONE_THEME = (type: string, series: object) => ({
    ...ROOM,
    theme: { overrides: { [type]: { series } } },
});

const ENTRIES: Record<string, Partial<GlowOptionsEntry>> = {
    'treemap tile': {
        opaquePart: 'tile',
        noHoveredShadow: true,
        options: GAP_OF_ONE_THEME('treemap', { tile: { glow: { gap: 1 } } }),
    },
    sunburst: {
        noHoveredShadow: true,
        edgeBudget: { series: 29000, hovered: 18500 },
        options: GAP_OF_ONE_THEME('sunburst', { glow: { gap: 1 } }),
    },
    'sankey nodes': { opaquePart: 'node', edgeBudget: { series: 21000, hovered: 1300 } },
    'sankey links': { opaquePart: 'link', edgeBudget: { series: 40000, hovered: 31000 } },
};

describe('shadow and glow options render (enterprise series)', () => {
    describeGlowOptions(
        Object.keys(ENTRIES).map((name) => ({
            testCase: glowCaseNamed([...HIERARCHY_GLOW_SERIES, ...ENTERPRISE_GLOW_SERIES], name),
            options: ROOM,
            ...ENTRIES[name],
        })),
        useGlowCharts(createEnterpriseChart)
    );
});
