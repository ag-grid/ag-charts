import {
    type CSSProperties,
    RefObject,
    createElement,
    forwardRef,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
} from 'react';

import {
    type AgChartInstance,
    type AgChartModule,
    type AgChartOptions,
    type AgChartParams,
    AgCharts as AgChartsAPI,
    AgFinancialChartOptions,
    AgGaugeOptions,
    AgQuadrantChartOptions,
} from 'ag-charts-community';

interface BaseChartProps {
    options: object;
    /** Modules registered for this chart only, in addition to any registered globally. Read when the chart is created. */
    modules?: AgChartModule[];
    style?: CSSProperties;
    className?: string;
}

// The merge below turns anything spreadable into a valid `{ container }` object, so `AgCharts.create()`'s
// own check can never see what the caller passed. Validate the raw prop first and report against it.
function getOptions(
    options: AgChartOptions,
    containerRef: RefObject<HTMLElement | null>,
    displayName: string
): AgChartOptions {
    return {
        ...AgChartsAPI.__validateOptionsArgument(options, `${displayName} \`options\` prop`),
        container: containerRef.current!,
    };
}

function ChartWithConstructor<Props extends BaseChartProps>(
    ctor: (options: Props['options'], params: AgChartParams) => AgChartInstance<Props['options']>,
    displayName: string
) {
    const Component = forwardRef<AgChartInstance, Props>(function AgChartsReact(props, ref) {
        const { options, modules, style, className } = props;
        const containerRef = useRef<HTMLDivElement>(null);
        const chartRef = useRef<AgChartInstance | undefined>();

        // This fires earlier than ideal - so has a negative impact on mounting performance
        // but it's important we do this so refs work as expected
        useLayoutEffect(() => {
            const chart = ctor(getOptions(options, containerRef, displayName), { modules });
            chartRef.current = chart;

            return () => {
                chart.destroy();
            };
        }, []);

        // Avoid updating immediately after creating the chart
        const unsafeIsInitialMount = chartRef.current === undefined;
        useEffect(() => {
            if (!unsafeIsInitialMount) {
                // The chart may already be destroyed, or may never have been created, so its logger is not
                // reachable here and raw console is the only guaranteed report.
                // eslint-disable-next-line no-console
                chartRef.current?.update(getOptions(options, containerRef, displayName)).catch((e) => console.error(e));
            }
        }, [options]);

        // Note useLayoutEffect is called before useImperativeHandle
        useImperativeHandle(ref, () => chartRef.current!, []);

        return useMemo(() => {
            return createElement('div', {
                ref: containerRef,
                style: style,
                className: className,
            });
        }, [style, className]);
    });

    Component.displayName = displayName;

    return Component;
}

export interface AgChartProps {
    options: AgChartOptions;
    modules?: AgChartModule[];
    style?: CSSProperties;
    className?: string;
}

export const AgCharts = /*#__PURE__*/ ChartWithConstructor<AgChartProps>(
    (options, params) => AgChartsAPI.create(options, params),
    'AgCharts'
);

export interface AgFinancialChartProps {
    options: AgFinancialChartOptions;
    modules?: AgChartModule[];
    style?: CSSProperties;
    className?: string;
}

export const AgFinancialCharts = /*#__PURE__*/ ChartWithConstructor<AgFinancialChartProps>(
    (options, params) => AgChartsAPI.createFinancialChart(options, params),
    'AgFinancialCharts'
);

export interface AgGaugeProps {
    options: AgGaugeOptions;
    modules?: AgChartModule[];
    style?: CSSProperties;
    className?: string;
}

export const AgGauge = /*#__PURE__*/ ChartWithConstructor<AgGaugeProps>(
    (options, params) => AgChartsAPI.createGauge(options, params),
    'AgGauge'
);

export interface AgQuadrantChartProps {
    options: AgQuadrantChartOptions;
    modules?: AgChartModule[];
    style?: CSSProperties;
    className?: string;
}

export const AgQuadrantChart = /*#__PURE__*/ ChartWithConstructor<AgQuadrantChartProps>(
    (options, params) => AgChartsAPI.createQuadrantChart(options, params),
    'AgQuadrantChart'
);
