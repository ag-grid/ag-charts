import * as PropTypes from 'prop-types';
import { CSSProperties, Component, type RefObject, createElement, createRef } from 'react';

import { type AgChartInstance, type AgChartOptions, AgCharts } from 'ag-charts-community';

export interface AgChartProps {
    options: AgChartOptions;
    onChartReady?: (chart: AgChartInstance) => void;
    /** @deprecated use style instead */
    containerStyle?: CSSProperties;
    style?: CSSProperties;
    className?: string;
}

interface AgChartState {}

export class AgChartsReact extends Component<AgChartProps, AgChartState> {
    static propTypes: any;

    public chart: AgChartInstance | undefined;

    protected containerRef: RefObject<HTMLElement>;

    constructor(public props: AgChartProps) {
        super(props);
        this.chart = undefined;
        this.containerRef = createRef();
    }

    render() {
        const { style = this.props.containerStyle, className } = this.props;
        return createElement('div', {
            style,
            className,
            ref: this.containerRef,
        });
    }

    componentDidMount() {
        const options = this.applyContainer(this.props.options);

        const chart = AgCharts.create(options);
        this.chart = chart;

        (chart as any).chart.waitForUpdate().then(() => this.props.onChartReady?.(chart));
    }

    componentDidUpdate() {
        if (this.chart != null) {
            AgCharts.update(this.chart, this.applyContainer(this.props.options));
        }
    }

    componentWillUnmount() {
        if (this.chart != null) {
            this.chart.destroy();
            this.chart = undefined;
        }
    }

    private applyContainer(propsOptions: any) {
        return { ...propsOptions, container: this.containerRef.current };
    }
}

AgChartsReact.propTypes = {
    options: PropTypes.object,
};
