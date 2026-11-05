import { PropType, defineComponent, h } from 'vue';

import {
    AgChartInstance,
    AgChartModule,
    AgChartOptions,
    AgCharts as AgChartsAPI,
    AgFinancialChartOptions,
    AgGaugeOptions,
    AgQuadrantChartOptions,
    AgVolumeProfileChartOptions,
} from 'ag-charts-community';

import { unwrapOptions, unwrapTransactions } from './unwrap';

// Spreading `options` makes any spreadable value a valid `{ container }`, hiding it from `create()`'s own guard,
// so validate what the caller passed first. Unwrapping gives the chart the caller's data, not Vue proxies of it.
function mergeOptions<O>(options: O, container: HTMLElement, componentName: string): O {
    const validated = AgChartsAPI.__validateOptionsArgument(options, `${componentName} \`options\` prop`);
    return { ...unwrapOptions(validated), container };
}

export const AgCharts = /*#__PURE__*/ defineComponent({
    props: {
        options: {
            type: Object as PropType<AgChartOptions>,
            default: (): AgChartOptions => ({}),
        },
        modules: {
            type: Array as PropType<AgChartModule[]>,
            default: undefined,
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
        const { options, modules } = this;
        this.chart = unwrapTransactions(AgChartsAPI.create(mergeOptions(options, this.$el, 'AgCharts'), { modules }));
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
        modules: {
            type: Array as PropType<AgChartModule[]>,
            default: undefined,
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
        const { options, modules } = this;
        this.chart = unwrapTransactions(
            AgChartsAPI.createFinancialChart(mergeOptions(options, this.$el, 'AgFinancialCharts'), {
                modules,
            })
        );
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
        modules: {
            type: Array as PropType<AgChartModule[]>,
            default: undefined,
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
        const { options, modules } = this;
        this.chart = unwrapTransactions(
            AgChartsAPI.createGauge(mergeOptions(options, this.$el, 'AgGauge'), { modules })
        );
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
        modules: {
            type: Array as PropType<AgChartModule[]>,
            default: undefined,
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
        const { options, modules } = this;
        this.chart = unwrapTransactions(
            AgChartsAPI.createQuadrantChart(mergeOptions(options, this.$el, 'AgQuadrantChart'), { modules })
        );
    },
    unmounted() {
        this.chart?.destroy();
        this.chart = undefined;
    },
});

export const AgVolumeProfileChart = /*#__PURE__*/ defineComponent({
    props: {
        options: {
            type: Object as PropType<AgVolumeProfileChartOptions>,
            required: true,
        },
        modules: {
            type: Array as PropType<AgChartModule[]>,
            default: undefined,
        },
    },
    setup(): { chart: AgChartInstance<AgVolumeProfileChartOptions> | undefined } {
        return {
            chart: undefined,
        };
    },
    render() {
        return h('div');
    },
    watch: {
        options(options) {
            this.chart?.update(mergeOptions(options, this.$el, 'AgVolumeProfileChart'));
        },
    },
    mounted() {
        const { options, modules } = this;
        this.chart = unwrapTransactions(
            AgChartsAPI.createVolumeProfileChart(mergeOptions(options, this.$el, 'AgVolumeProfileChart'), {
                modules,
            })
        );
    },
    unmounted() {
        this.chart?.destroy();
        this.chart = undefined;
    },
});
