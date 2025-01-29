import { PropType, defineComponent, h } from 'vue';

import {
    AgChartInstance,
    AgChartOptions,
    AgCharts as AgChartsAPI,
    AgFinancialChartOptions,
    AgGaugeOptions,
} from 'ag-charts-community';

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
        // "options.series": {
        //     handler(newValue, oldValue) {
        //         this.chart?.update({...newValue, container: this.$el});
        //     },
        //     deep: true
        // },
        options: {
            handler(newValue, oldValue) {
                this.chart?.update({ ...newValue, container: this.$el });
            },
            deep: true,
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
    setup(): { chart: AgChartInstance<AgFinancialChartOptions> | undefined } {
        return {
            chart: undefined,
        };
    },
    render() {
        return h('div');
    },
    watch: {
        options: {
            handler(newValue, oldValue) {
                this.chart?.update({ ...newValue, container: this.$el });
            },
            deep: 5,
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
        options: {
            handler(newValue, oldValue) {
                this.chart?.update({ ...newValue, container: this.$el });
            },
            deep: 5,
        },
    },
    mounted() {
        const { options } = this;
        this.chart = AgChartsAPI.createGauge({ ...options, container: this.$el });
    },
    unmounted() {
        this.chart?.destroy();
        this.chart = undefined;
    },
});
