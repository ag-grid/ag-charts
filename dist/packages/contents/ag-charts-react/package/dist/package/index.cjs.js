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

// packages/ag-charts-react/src/index.ts
var src_exports = {};
__export(src_exports, {
  AgCharts: () => AgCharts,
  AgFinancialCharts: () => AgFinancialCharts
});
module.exports = __toCommonJS(src_exports);
var import_react = require("react");
var import_ag_charts_community = require("ag-charts-community");
function getOptions(options, containerRef) {
  return {
    ...options,
    container: containerRef.current
  };
}
function ChartWithConstructor(ctor, displayName) {
  const Component = (0, import_react.forwardRef)(function AgChartsReact(props, ref) {
    const { options, style, className } = props;
    const containerRef = (0, import_react.useRef)(null);
    const chartRef = (0, import_react.useRef)();
    (0, import_react.useLayoutEffect)(() => {
      const chart = ctor(getOptions(options, containerRef));
      chartRef.current = chart;
      return () => {
        chart.destroy();
      };
    }, []);
    const unsafeIsInitialMount = chartRef.current === void 0;
    (0, import_react.useEffect)(() => {
      if (!unsafeIsInitialMount) {
        void chartRef.current?.update(getOptions(options, containerRef));
      }
    }, [options]);
    (0, import_react.useImperativeHandle)(ref, () => chartRef.current, []);
    return (0, import_react.useMemo)(() => {
      return (0, import_react.createElement)("div", {
        ref: containerRef,
        style,
        className
      });
    }, [style, className]);
  });
  Component.displayName = displayName;
  return Component;
}
var AgCharts = /* @__PURE__ */ ChartWithConstructor(
  (options) => import_ag_charts_community.AgCharts.create(options),
  "AgCharts"
);
var AgFinancialCharts = /* @__PURE__ */ ChartWithConstructor(
  (options) => import_ag_charts_community.AgCharts.createFinancialChart(options),
  "AgFinancialCharts"
);
