import { PropType, defineComponent, h } from 'vue';

import {
    AgChartInstance,
    AgChartOptions,
    AgCharts as AgChartsAPI,
    AgFinancialChartOptions,
    AgGaugeOptions,
    AgQuadrantChartOptions,
} from 'ag-charts-community';

// Spreading `options` into the container merge turns anything spreadable into a valid `{ container }`
// object, so `AgCharts.create()`'s own guard can never see what the caller passed. Validate the raw prop.
function mergeOptions<O>(options: O, container: HTMLElement, componentName: string): O {
    return { ...AgChartsAPI.__validateOptionsArgument(options, `${componentName} \`options\` prop`), container };
}

export const AgCharts = /*#__PURE__*/ defineComponent({
    props: {
        options: {
            type: Object as PropType<AgChartOptions>,
            default: (): AgChartOptions => ({}),
        },
    },
    setup(): { chart: AgChartInstance | undefined } {
        return {
            chart: undefined,
        };
    },
    render() {
        return h('div');
    },
    watch: {
        options(options) {
            this.chart?.update(mergeOptions(options, this.$el, 'AgCharts'));
        },
    },
    mounted() {
        const { options } = this;
        this.chart = AgChartsAPI.create(mergeOptions(options, this.$el, 'AgCharts'));
    },
    unmounted() {
        this.chart?.destroy();
        this.chart = undefined;
    },
});

export const AgFinancialCharts = /*#__PURE__*/ defineComponent({
    props: {
        options: {
            type: Object as PropType<AgFinancialChartOptions>,
            default: (): AgFinancialChartOptions => ({}),
        },
    },
    setup(): { chart: AgChartInstance<AgFinancialChartOptions> | undefined } {
        return {
            chart: undefined,
        };
    },
    render() {
        return h('div');
    },
    watch: {
        options(options) {
            this.chart?.update(mergeOptions(options, this.$el, 'AgFinancialCharts'));
        },
    },
    mounted() {
        const { options } = this;
        this.chart = AgChartsAPI.createFinancialChart(mergeOptions(options, this.$el, 'AgFinancialCharts'));
    },
    unmounted() {
        this.chart?.destroy();
        this.chart = undefined;
    },
});

export const AgGauge = /*#__PURE__*/ defineComponent({
    props: {
        options: {
            type: Object as PropType<AgGaugeOptions>,
            default: (): AgGaugeOptions => ({ type: 'radial-gauge', value: 0 }),
        },
    },
    setup(): { chart: AgChartInstance<AgGaugeOptions> | undefined } {
        return {
            chart: undefined,
        };
    },
    render() {
        return h('div');
    },
    watch: {
        options(options) {
            this.chart?.update(mergeOptions(options, this.$el, 'AgGauge'));
        },
    },
    mounted() {
        const { options } = this;
        this.chart = AgChartsAPI.createGauge(mergeOptions(options, this.$el, 'AgGauge'));
    },
    unmounted() {
        this.chart?.destroy();
        this.chart = undefined;
    },
});

export const AgQuadrantChart = /*#__PURE__*/ defineComponent({
    props: {
        options: {
            type: Object as PropType<AgQuadrantChartOptions>,
            required: true,
        },
    },
    setup(): { chart: AgChartInstance<AgQuadrantChartOptions> | undefined } {
        return {
            chart: undefined,
        };
    },
    render() {
        return h('div');
    },
    watch: {
        options(options) {
            this.chart?.update(mergeOptions(options, this.$el, 'AgQuadrantChart'));
        },
    },
    mounted() {
        const { options } = this;
        this.chart = AgChartsAPI.createQuadrantChart(mergeOptions(options, this.$el, 'AgQuadrantChart'));
    },
    unmounted() {
        this.chart?.destroy();
        this.chart = undefined;
    },
});
