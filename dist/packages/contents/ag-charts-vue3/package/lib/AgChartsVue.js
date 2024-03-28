var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { toRaw } from '@vue/reactivity';
import { h } from 'vue';
import { Options, Vue } from 'vue-class-component';
import { AgCharts } from 'ag-charts-community';
let AgChartsVue = class AgChartsVue extends Vue {
    constructor() {
        super(...arguments);
        this.isCreated = false;
        this.isDestroyed = false;
    }
    // noinspection JSUnusedGlobalSymbols, JSMethodCanBeStatic
    render() {
        return h('div', { style: { height: '100%' }, ref: 'agChartRef' });
    }
    mounted() {
        const options = this.applyContainerIfNotSet(this.options);
        this.chart = AgCharts.create(options);
        this.$watch('options', (newValue, oldValue) => {
            this.processChanges(newValue, oldValue);
        }, {
            deep: true,
        });
        this.isCreated = true;
        this.chart.chart.waitForUpdate().then(() => this.$emit('onChartReady', this.chart));
    }
    destroyed() {
        if (this.isCreated) {
            if (this.chart) {
                this.chart.destroy();
            }
            this.isDestroyed = true;
        }
    }
    unmounted() {
        this.destroyed();
    }
    processChanges(currentValue, previousValue) {
        if (this.isCreated && this.chart) {
            AgCharts.update(this.chart, toRaw(this.applyContainerIfNotSet(toRaw(this.options))));
        }
    }
    applyContainerIfNotSet(propsOptions) {
        if (propsOptions.container) {
            return propsOptions;
        }
        return Object.assign(Object.assign({}, propsOptions), { container: this.$refs.agChartRef });
    }
};
AgChartsVue = __decorate([
    Options({
        props: {
            options: {},
        },
        emits: ['onChartReady'],
        // watch: {
        //     options: {
        //         handler(currentValue, previousValue) {
        //             this.processChanges( currentValue, previousValue);
        //         },
        //         deep: true,
        //     },
        // },
    })
], AgChartsVue);
export { AgChartsVue };
