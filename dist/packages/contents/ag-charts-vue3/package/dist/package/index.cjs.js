"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/ag-charts-vue3/src/index.ts
var src_exports = {};
__export(src_exports, {
  AgCharts: () => AgCharts,
  AgFinancialCharts: () => AgFinancialCharts
});
module.exports = __toCommonJS(src_exports);
var import_vue = require("vue");
var import_ag_charts_community = require("ag-charts-community");
var AgCharts = /* @__PURE__ */ (0, import_vue.defineComponent)({
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
    return (0, import_vue.h)("div");
  },
  watch: {
    options(options) {
      this.chart?.update({ ...options, container: this.$el });
    }
  },
  mounted() {
    const { options } = this;
    this.chart = import_ag_charts_community.AgCharts.create({ ...options, container: this.$el });
  },
  unmounted() {
    this.chart?.destroy();
    this.chart = void 0;
  }
});
var AgFinancialCharts = /* @__PURE__ */ (0, import_vue.defineComponent)({
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
    return (0, import_vue.h)("div");
  },
  watch: {
    options(options) {
      (0, import_vue.toRaw)(this.chart)?.update({ ...options, container: this.$el });
    }
  },
  mounted() {
    const { options } = this;
    this.chart = import_ag_charts_community.AgCharts.createFinancialChart({ ...options, container: this.$el });
  },
  unmounted() {
    this.chart?.destroy();
    this.chart = void 0;
  }
});
