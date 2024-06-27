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
} from 'ag-charts-community';

interface BaseChartProps {
    options: {};
    style?: CSSProperties;
    className?: string;
}

function getOptions(options: AgChartOptions, containerRef: RefObject<HTMLElement | null>): AgChartOptions {
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
            const chart = ctor(getOptions(options, containerRef));
            chartRef.current = chart;

            return () => {
                chart.destroy();
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        // Avoid updating immediately after creating the chart
        const unsafeIsInitialMount = chartRef.current === undefined;
        useEffect(() => {
            if (!unsafeIsInitialMount) {
                void chartRef.current?.update(getOptions(options, containerRef));
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
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
