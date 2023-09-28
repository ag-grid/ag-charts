import { Component, Vue } from 'vue-property-decorator';

import { AgChart, AgChartInstance, AgChartOptions } from 'ag-charts-community';

@Component({
    props: {
        options: {},
    },
})
export class AgChartsVue extends Vue {
    public chart?: AgChartInstance;

    private isCreated = false;
    private isDestroyed = false;

    private options!: AgChartOptions;

    public render(h: any) {
        return h('div', { style: { height: '100%' } });
    }

    public mounted() {
        const options = this.applyContainerIfNotSet(this.options);

        this.chart = AgChart.create(options);

        this.$watch('options', (newValue, oldValue) => {
            this.processChanges(newValue, oldValue);
        });

        this.isCreated = true;

        (this.chart as any).chart.waitForUpdate().then(() => this.$emit('onChartReady', this.chart));
    }

    public destroyed() {
        if (this.isCreated) {
            if (this.chart) {
                this.chart.destroy();
            }

            this.isDestroyed = true;
        }
    }

    private processChanges(currentValue: any, previousValue: any) {
        if (this.isCreated && this.chart) {
            AgChart.update(this.chart, this.applyContainerIfNotSet(this.options));
        }
    }

    private applyContainerIfNotSet(propsOptions: AgChartOptions): AgChartOptions {
        if (propsOptions.container) {
            return propsOptions;
        }

        return { ...propsOptions, container: this.$el as HTMLElement };
    }
}
