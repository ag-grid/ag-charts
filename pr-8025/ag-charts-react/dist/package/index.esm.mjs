// packages/ag-charts-react/src/index.ts
import {
  createElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef
} from "react";
import {
  AgCharts as AgChartsAPI
} from "ag-charts-community";
function getOptions(options, containerRef, displayName) {
  return {
    ...AgChartsAPI.__validateOptionsArgument(options, `${displayName} \`options\` prop`),
    container: containerRef.current
  };
}
function ChartWithConstructor(ctor, displayName) {
  const Component = forwardRef(function AgChartsReact(props, ref) {
    const { options, modules, style, className } = props;
    const containerRef = useRef(null);
    const chartRef = useRef();
    useLayoutEffect(() => {
      const chart = ctor(getOptions(options, containerRef, displayName), { modules });
      chartRef.current = chart;
      return () => {
        chart.destroy();
      };
    }, []);
    const unsafeIsInitialMount = chartRef.current === void 0;
    useEffect(() => {
      if (!unsafeIsInitialMount) {
        chartRef.current?.update(getOptions(options, containerRef, displayName)).catch((e) => console.error(e));
      }
    }, [options]);
    useImperativeHandle(ref, () => chartRef.current, []);
    return useMemo(() => {
      return createElement("div", {
        ref: containerRef,
        style,
        className
      });
    }, [style, className]);
  });
  Component.displayName = displayName;
  return Component;
}
var AgCharts = /* @__PURE__ */ /*#__PURE__*/ ChartWithConstructor(
  (options, params) => AgChartsAPI.create(options, params),
  "AgCharts"
);
var AgFinancialCharts = /* @__PURE__ */ /*#__PURE__*/ ChartWithConstructor(
  (options, params) => AgChartsAPI.createFinancialChart(options, params),
  "AgFinancialCharts"
);
var AgGauge = /* @__PURE__ */ /*#__PURE__*/ ChartWithConstructor(
  (options, params) => AgChartsAPI.createGauge(options, params),
  "AgGauge"
);
var AgQuadrantChart = /* @__PURE__ */ /*#__PURE__*/ ChartWithConstructor(
  (options, params) => AgChartsAPI.createQuadrantChart(options, params),
  "AgQuadrantChart"
);
export {
  AgCharts,
  AgFinancialCharts,
  AgGauge,
  AgQuadrantChart
};
//# sourceMappingURL=index.esm.mjs.map
