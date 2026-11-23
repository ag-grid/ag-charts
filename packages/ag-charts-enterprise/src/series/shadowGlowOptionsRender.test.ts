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

const ENTRIES: Record<string, Partial<GlowOptionsEntry>> = {
    'treemap tile': { opaquePart: 'tile', noHoveredShadow: true },
    sunburst: { noHoveredShadow: true, edgeBudget: { series: 29000, hovered: 18500 } },
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
