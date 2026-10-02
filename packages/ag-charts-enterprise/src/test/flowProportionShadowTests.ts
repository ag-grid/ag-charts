// Uses vitest globals (enabled in vitest.config.ts) so this dev-only helper adds no
// npm-dev dependency edge from src/ (see the not-to-dev-dep dependency-cruiser rule).
import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import { deproxy, waitForChartStability } from 'ag-charts-community-test';

import { DEFAULT_DISABLED_SHADOW, collectShapes, prepareEnterpriseTestOptions } from './utils';

export const FLOW_PROPORTION_SHADOW = { enabled: true, color: 'rgba(0, 0, 0, 0.6)', xOffset: 4, yOffset: 4, blur: 6 };

const DATA = [
    { from: 'A', to: 'C', size: 8 },
    { from: 'A', to: 'D', size: 4 },
    { from: 'B', to: 'C', size: 5 },
    { from: 'B', to: 'D', size: 7 },
];

type FlowProportionShadow = typeof FLOW_PROPORTION_SHADOW;

export function flowProportionShadowOptions(
    type: 'sankey' | 'chord',
    parts: { link?: FlowProportionShadow; node?: FlowProportionShadow } = {}
): AgChartOptions {
    return {
        data: DATA,
        series: [
            {
                type,
                fromKey: 'from',
                toKey: 'to',
                sizeKey: 'size',
                link: { shadow: parts.link },
                node: { shadow: parts.node },
            },
        ],
        legend: { enabled: false },
    } as AgChartOptions;
}

interface FlowProportionShadowSuiteConfig {
    type: 'sankey' | 'chord';
    /** Hands the created chart to the enclosing suite so its `afterEach` destroys it. */
    setChart: (chart: any) => void;
    /** The enclosing suite's image-snapshot comparison of its current chart. */
    compare: () => Promise<void>;
}

/** Registers the `shadow` suite shared by the sankey and chord series, which have identical node/link shadow wiring. */
export function describeFlowProportionShadow({ type, setChart, compare }: FlowProportionShadowSuiteConfig) {
    describe('shadow', () => {
        const shadow = FLOW_PROPORTION_SHADOW;
        const createChart = async (options: AgChartOptions) => {
            prepareEnterpriseTestOptions(options);
            const chart = deproxy(AgCharts.create(options));
            setChart(chart);
            await waitForChartStability(chart);
            return chart.series[0] as any;
        };
        const shadowedShapes = (group: any) => collectShapes(group).filter((shape) => shape.fillShadow?.enabled);

        it('defaults to disabled link and node shadows', async () => {
            const series = await createChart(flowProportionShadowOptions(type));

            expect(series['options'].link.shadow).toEqual(DEFAULT_DISABLED_SHADOW);
            expect(series['options'].node.shadow).toEqual(DEFAULT_DISABLED_SHADOW);
        });

        it('shadows nothing when no shadow is set', async () => {
            const series = await createChart(flowProportionShadowOptions(type));

            expect(collectShapes(series.linkGroup)).toHaveLength(DATA.length);
            expect(collectShapes(series.nodeGroup)).toHaveLength(4);
            expect(shadowedShapes(series.contentGroup)).toEqual([]);
        });

        it.each(['link', 'node'] as const)(
            'shadows only the %s shapes when only that shadow is enabled',
            async (part) => {
                const series = await createChart(flowProportionShadowOptions(type, { [part]: shadow }));

                const [shadowedGroup, plainGroup] =
                    part === 'link' ? [series.linkGroup, series.nodeGroup] : [series.nodeGroup, series.linkGroup];
                const shapes = collectShapes(shadowedGroup);
                expect(shapes.length).toBeGreaterThan(0);
                for (const shape of shapes) {
                    expect(shape.fillShadow).toMatchObject(shadow);
                }
                expect(shadowedShapes(plainGroup)).toEqual([]);
            }
        );

        it('should render a chart with link and node shadows enabled', async () => {
            await createChart(flowProportionShadowOptions(type, { link: shadow, node: shadow }));
            await compare();
        });
    });
}
