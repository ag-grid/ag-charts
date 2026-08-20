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
    type AgChartOptions,
    AgCharts as AgChartsAPI,
    AgFinancialChartOptions,
    AgGaugeOptions,
    AgQuadrantChartOptions,
} from 'ag-charts-community';

interface BaseChartProps {
    options: object;
    style?: CSSProperties;
    className?: string;
}

// The merge below turns anything spreadable into a valid `{ container }` object - `undefined`, `3`
// and `{}` all become one - so `AgCharts.create()`'s own guard can never see what the caller passed.
// Validate the raw prop first, and report the same error against the prop rather than the factory.
function getOptions(
    options: AgChartOptions,
    containerRef: RefObject<HTMLElement | null>,
    displayName: string
): AgChartOptions {
    AgChartsAPI.__assertValidOptions(options, `${displayName} \`options\` prop`);
    return {
        ...options,
        container: containerRef.current!,
    };
}

function ChartWithConstructor<Props extends BaseChartProps>(
    ctor: (options: Props['options']) => AgChartInstance<Props['options']>,
    displayName: string
) {
    const Component = forwardRef<AgChartInstance, Props>(function AgChartsReact(props, ref) {
        const { options, style, className } = props;
        const containerRef = useRef<HTMLDivElement>(null);
        const chartRef = useRef<AgChartInstance | undefined>();

        // This fires earlier than ideal - so has a negative impact on mounting performance
        // but it's important we do this so refs work as expected
        useLayoutEffect(() => {
            const chart = ctor(getOptions(options, containerRef, displayName));
            chartRef.current = chart;

            return () => {
                chart.destroy();
            };
        }, []);

        // Avoid updating immediately after creating the chart
        const unsafeIsInitialMount = chartRef.current === undefined;
        useEffect(() => {
            if (!unsafeIsInitialMount) {
                // The chart's logger may be absent here — the chart may already be destroyed, or may
                // never have been created — so raw console is the only guaranteed report. The wrapper
                // holds only the public `AgChartInstance` type, which exposes no logger.
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
    style?: CSSProperties;
    className?: string;
}

export const AgCharts = /*#__PURE__*/ ChartWithConstructor<AgChartProps>(
    (options) => AgChartsAPI.create(options),
    'AgCharts'
);

export interface AgFinancialChartProps {
    options: AgFinancialChartOptions;
    style?: CSSProperties;
    className?: string;
}

export const AgFinancialCharts = /*#__PURE__*/ ChartWithConstructor<AgFinancialChartProps>(
    (options) => AgChartsAPI.createFinancialChart(options),
    'AgFinancialCharts'
);

export interface AgGaugeProps {
    options: AgGaugeOptions;
    style?: CSSProperties;
    className?: string;
}

export const AgGauge = /*#__PURE__*/ ChartWithConstructor<AgGaugeProps>(
    (options) => AgChartsAPI.createGauge(options),
    'AgGauge'
);

export interface AgQuadrantChartProps {
    options: AgQuadrantChartOptions;
    style?: CSSProperties;
    className?: string;
}

export const AgQuadrantChart = /*#__PURE__*/ ChartWithConstructor<AgQuadrantChartProps>(
    (options) => AgChartsAPI.createQuadrantChart(options),
    'AgQuadrantChart'
);
