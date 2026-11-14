// packages/ag-charts-vue3/src/index.ts
import { defineComponent, h } from "vue";
import {
  AgCharts as AgChartsAPI
} from "ag-charts-community";

// packages/ag-charts-vue3/src/unwrap.ts
import { toRaw } from "vue";
function isPlainObject(value) {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
function unwrapItems(items) {
  let result;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const raw = typeof item === "object" && item !== null ? toRaw(item) : item;
    if (raw !== item && result === void 0) {
      result = items.slice(0, i);
    }
    result?.push(raw);
  }
  return result ?? items;
}
function unwrap(value, key, active, done) {
  if (typeof value !== "object" || value === null)
    return value;
  const raw = toRaw(value);
  if (active.has(raw))
    return raw;
  if (Array.isArray(raw) && key === "data")
    return unwrapItems(raw);
  if (done.has(raw))
    return done.get(raw);
  if (!Array.isArray(raw) && !isPlainObject(raw))
    return raw;
  const holder = value;
  let result;
  active.add(raw);
  if (Array.isArray(raw)) {
    for (let i = 0; i < raw.length; i++) {
      const next = unwrap(holder[i], void 0, active, done);
      if (next !== raw[i]) {
        result ??= raw.slice(0, i);
      }
      result?.push(next);
    }
  } else {
    for (const k of Object.keys(raw)) {
      const item = raw[k];
      const read = holder === raw ? item : holder[k];
      const next = k === "context" ? read : unwrap(read, k, active, done);
      if (next !== item) {
        result ??= { ...raw };
        result[k] = next;
      }
    }
  }
  active.delete(raw);
  done.set(raw, result ?? raw);
  return result ?? raw;
}
function unwrapOptions(options) {
  return unwrap(options, void 0, /* @__PURE__ */ new Set(), /* @__PURE__ */ new Map());
}
function unwrapTransaction(transaction) {
  if (typeof transaction !== "object" || transaction === null)
    return transaction;
  if (!isPlainObject(toRaw(transaction)))
    return transaction;
  const fields = transaction;
  let result;
  for (const key of ["add", "remove", "update"]) {
    const operation = fields[key];
    const items = typeof operation === "object" && operation !== null ? toRaw(operation) : operation;
    if (!Array.isArray(items))
      continue;
    const unwrapped = unwrapItems(items);
    if (unwrapped !== operation) {
      result ??= { ...fields };
      result[key] = unwrapped;
    }
  }
  return result ?? transaction;
}
function unwrapTransactions(chart) {
  const target = chart;
  const { applyTransaction } = target;
  target.applyTransaction = (transaction) => applyTransaction.call(chart, unwrapTransaction(transaction));
  return chart;
}

// packages/ag-charts-vue3/src/index.ts
function mergeOptions(options, container, componentName) {
  const validated = AgChartsAPI.__validateOptionsArgument(options, `${componentName} \`options\` prop`);
  return { ...unwrapOptions(validated), container };
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
    this.chart = unwrapTransactions(AgChartsAPI.create(mergeOptions(options, this.$el, "AgCharts"), { modules }));
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
    this.chart = unwrapTransactions(
      AgChartsAPI.createFinancialChart(mergeOptions(options, this.$el, "AgFinancialCharts"), {
        modules
      })
    );
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
    this.chart = unwrapTransactions(
      AgChartsAPI.createGauge(mergeOptions(options, this.$el, "AgGauge"), { modules })
    );
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
    this.chart = unwrapTransactions(
      AgChartsAPI.createQuadrantChart(mergeOptions(options, this.$el, "AgQuadrantChart"), { modules })
    );
  },
  unmounted() {
    this.chart?.destroy();
    this.chart = void 0;
  }
});
var AgVolumeProfileChart = /* @__PURE__ */ /*#__PURE__*/ defineComponent({
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
      this.chart?.update(mergeOptions(options, this.$el, "AgVolumeProfileChart"));
    }
  },
  mounted() {
    const { options, modules } = this;
    this.chart = unwrapTransactions(
      AgChartsAPI.createVolumeProfileChart(mergeOptions(options, this.$el, "AgVolumeProfileChart"), {
        modules
      })
    );
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
  AgQuadrantChart,
  AgVolumeProfileChart
};
//# sourceMappingURL=index.esm.mjs.map
