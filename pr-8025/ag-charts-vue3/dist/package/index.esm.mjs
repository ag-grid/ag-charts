// packages/ag-charts-vue3/src/index.ts
import { defineComponent, h } from "vue";
import {
  AgCharts as AgChartsAPI
} from "ag-charts-community";
function mergeOptions(options, container, componentName) {
  return { ...AgChartsAPI.__validateOptionsArgument(options, `${componentName} \`options\` prop`), container };
}
var AgCharts = /* @__PURE__ */ /*#__PURE__*/ defineComponent({
  props: {
    options: {
      type: Object,
      default: () => ({})
    },
    modules: {
      type: Array,
      default: void 0
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
      this.chart?.update(mergeOptions(options, this.$el, "AgCharts"));
    }
  },
  mounted() {
    const { options, modules } = this;
    this.chart = AgChartsAPI.create(mergeOptions(options, this.$el, "AgCharts"), { modules });
  },
  unmounted() {
    this.chart?.destroy();
    this.chart = void 0;
  }
});
var AgFinancialCharts = /* @__PURE__ */ /*#__PURE__*/ defineComponent({
  props: {
    options: {
      type: Object,
      default: () => ({})
    },
    modules: {
      type: Array,
      default: void 0
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
      this.chart?.update(mergeOptions(options, this.$el, "AgFinancialCharts"));
    }
  },
  mounted() {
    const { options, modules } = this;
    this.chart = AgChartsAPI.createFinancialChart(mergeOptions(options, this.$el, "AgFinancialCharts"), {
      modules
    });
  },
  unmounted() {
    this.chart?.destroy();
    this.chart = void 0;
  }
});
var AgGauge = /* @__PURE__ */ /*#__PURE__*/ defineComponent({
  props: {
    options: {
      type: Object,
      default: () => ({ type: "radial-gauge", value: 0 })
    },
    modules: {
      type: Array,
      default: void 0
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
      this.chart?.update(mergeOptions(options, this.$el, "AgGauge"));
    }
  },
  mounted() {
    const { options, modules } = this;
    this.chart = AgChartsAPI.createGauge(mergeOptions(options, this.$el, "AgGauge"), { modules });
  },
  unmounted() {
    this.chart?.destroy();
    this.chart = void 0;
  }
});
var AgQuadrantChart = /* @__PURE__ */ /*#__PURE__*/ defineComponent({
  props: {
    options: {
      type: Object,
      required: true
    },
    modules: {
      type: Array,
      default: void 0
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
      this.chart?.update(mergeOptions(options, this.$el, "AgQuadrantChart"));
    }
  },
  mounted() {
    const { options, modules } = this;
    this.chart = AgChartsAPI.createQuadrantChart(mergeOptions(options, this.$el, "AgQuadrantChart"), { modules });
  },
  unmounted() {
    this.chart?.destroy();
    this.chart = void 0;
  }
});
export {
  AgCharts,
  AgFinancialCharts,
  AgGauge,
  AgQuadrantChart
};
//# sourceMappingURL=index.esm.mjs.map
