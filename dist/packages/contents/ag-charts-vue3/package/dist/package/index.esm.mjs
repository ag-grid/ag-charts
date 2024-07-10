// packages/ag-charts-vue3/src/index.ts
import { defineComponent, h, toRaw } from "vue";
import { AgCharts as AgChartsAPI } from "ag-charts-community";
var AgCharts = /* @__PURE__ */ defineComponent({
  props: {
    options: {
      type: Object,
      default: () => ({})
    }
  },
  setup() {
    return {
      chart: void 0
    };
  },
  render() {
    return h("div");
  },
  watch: {
    options(options) {
      this.chart?.update({ ...options, container: this.$el });
    }
  },
  mounted() {
    const { options } = this;
    this.chart = AgChartsAPI.create({ ...options, container: this.$el });
  },
  unmounted() {
    this.chart?.destroy();
    this.chart = void 0;
  }
});
var AgFinancialCharts = /* @__PURE__ */ defineComponent({
  props: {
    options: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      chart: void 0
    };
  },
  render() {
    return h("div");
  },
  watch: {
    options(options) {
      toRaw(this.chart)?.update({ ...options, container: this.$el });
    }
  },
  mounted() {
    const { options } = this;
    this.chart = AgChartsAPI.createFinancialChart({ ...options, container: this.$el });
  },
  unmounted() {
    this.chart?.destroy();
    this.chart = void 0;
  }
});
export {
  AgCharts,
  AgFinancialCharts
};
