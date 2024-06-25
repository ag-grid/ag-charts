import { PropType, defineComponent, h, toRaw } from 'vue';

import { AgChartInstance, AgChartOptions, AgCharts as AgChartsAPI, AgFinancialChartOptions } from 'ag-charts-community';

export const AgCharts = /*#__PURE__*/ defineComponent({
    props: {
        options: {
            type: Object as PropType<AgChartOptions>,
            default: (): AgChartOptions => ({}),
        },
    },
    data(): { chart: AgChartInstance | undefined } {
        return {
            chart: undefined,
        };
    },
    render() {
        return h('div');
    },
    watch: {
        options(options) {
            toRaw(this.chart)?.update({ ...options, container: this.$el });
        },
    },
    mounted() {
        const { options } = this;
        this.chart = AgChartsAPI.create({ ...options, container: this.$el });
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
    data(): { chart: AgChartInstance<AgFinancialChartOptions> | undefined } {
        return {
            chart: undefined,
        };
    },
    render() {
        return h('div');
    },
    watch: {
        options(options) {
            toRaw(this.chart)?.update({ ...options, container: this.$el });
        },
    },
    mounted() {
        const { options } = this;
        this.chart = AgChartsAPI.createFinancialChart({ ...options, container: this.$el });
    },
    unmounted() {
        this.chart?.destroy();
        this.chart = undefined;
    },
});
