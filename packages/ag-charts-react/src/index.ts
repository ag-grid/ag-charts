import {
    type CSSProperties,
    RefObject,
    createElement,
    forwardRef,
    memo,
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
} from 'ag-charts-community';

interface BaseChartProps {
    options: object;
    style?: CSSProperties;
    className?: string;
}

function isEmpty<T extends object>(obj: T): boolean {
    for (const _ in obj) {
        return false;
    }
    return true;
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
        const { style, className, options: optionsProp, ...topLevelOptions } = props;
        const containerRef = useRef<HTMLDivElement>(null);
        const chartRef = useRef<AgChartInstance | undefined>();

        const options = isEmpty(topLevelOptions) ? optionsProp : { ...topLevelOptions, ...optionsProp };

        // This fires earlier than ideal - so has a negative impact on mounting performance
        // but it's important we do this so refs work as expected
        useLayoutEffect(() => {
            const chart = ctor(getOptions(options, containerRef));
            chartRef.current = chart;

            return () => {
                chart.destroy();
            };
        }, []);

        // Avoid updating immediately after creating the chart
        const unsafeIsInitialMount = chartRef.current === undefined;
        useEffect(() => {
            if (!unsafeIsInitialMount) {
                // eslint-disable-next-line no-console
                chartRef.current?.update(getOptions(options, containerRef)).catch((e) => console.error(e));
            }
        }); // Dependency array does nothing here - but the component is already memo'd

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

    return memo(Component);
}

export interface AgChartProps extends Omit<AgChartOptions, 'container'> {
    options: AgChartOptions;
    style?: CSSProperties;
    className?: string;
}

export const AgCharts = /*#__PURE__*/ ChartWithConstructor<AgChartProps>(
    (options) => AgChartsAPI.create(options),
    'AgCharts'
);

export interface AgFinancialChartProps extends Omit<AgFinancialChartOptions, 'container'> {
    options: AgFinancialChartOptions;
    style?: CSSProperties;
    className?: string;
}

export const AgFinancialCharts = /*#__PURE__*/ ChartWithConstructor<AgFinancialChartProps>(
    (options) => AgChartsAPI.createFinancialChart(options),
    'AgFinancialCharts'
);

export interface AgGaugeProps extends Omit<AgGaugeOptions, 'container'> {
    options: AgGaugeOptions;
    style?: CSSProperties;
    className?: string;
}

export const AgGauge = /*#__PURE__*/ ChartWithConstructor<AgGaugeProps>(
    (options) => AgChartsAPI.createGauge(options),
    'AgGauge'
);
