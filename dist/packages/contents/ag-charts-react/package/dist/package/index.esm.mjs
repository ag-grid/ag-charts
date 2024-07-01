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
function getOptions(options, containerRef) {
  return {
    ...options,
    container: containerRef.current
  };
}
function ChartWithConstructor(ctor, displayName) {
  const Component = forwardRef(function AgChartsReact(props, ref) {
    const { options, style, className } = props;
    const containerRef = useRef(null);
    const chartRef = useRef();
    useLayoutEffect(() => {
      const chart = ctor(getOptions(options, containerRef));
      chartRef.current = chart;
      return () => {
        chart.destroy();
      };
    }, []);
    const unsafeIsInitialMount = chartRef.current === void 0;
    useEffect(() => {
      if (!unsafeIsInitialMount) {
        void chartRef.current?.update(getOptions(options, containerRef));
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
var AgCharts = /* @__PURE__ */ ChartWithConstructor(
  (options) => AgChartsAPI.create(options),
  "AgCharts"
);
var AgFinancialCharts = /* @__PURE__ */ ChartWithConstructor(
  (options) => AgChartsAPI.createFinancialChart(options),
  "AgFinancialCharts"
);
export {
  AgCharts,
  AgFinancialCharts
};
