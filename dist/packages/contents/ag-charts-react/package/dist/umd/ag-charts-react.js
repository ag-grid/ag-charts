(function (g, f) {
    if ("object" == typeof exports && "object" == typeof module) {
      module.exports = f(require('ag-charts-community'), require('react'), require('react-dom'));
    } else if ("function" == typeof define && define.amd) {
      define("AgCharts", ['ag-charts-community', 'react', 'react-dom'], f);
    } else if ("object" == typeof exports) {
      exports["AgCharts"] = f(require('ag-charts-community'), require('react'), require('react-dom'));
    } else {
      g["AgCharts"] = f(g["agCharts"], g["React"], g["ReactDOM"]);
    }
  }(this, (__da, __db, __dc) => {
var exports = {};
var module = { exports };
if (typeof require === 'undefined') {
    function require(name) {
        if (name === 'ag-charts-community') return __da;
        if (name === 'react') return __db;
        if (name === 'react-dom') return __dc;
        throw new Error('Unknown module: ' + name);
    }
}
        
"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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

// packages/ag-charts-react/dist/package/index.esm.mjs
var index_esm_exports = {};
__export(index_esm_exports, {
  AgCharts: () => AgCharts,
  AgFinancialCharts: () => AgFinancialCharts
});
module.exports = __toCommonJS(index_esm_exports);
var import_react = require("react");
var import_ag_charts_community = require("ag-charts-community");
function getOptions(options, containerRef) {
  return __spreadProps(__spreadValues({}, options), {
    container: containerRef.current
  });
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
      var _a;
      if (!unsafeIsInitialMount) {
        void ((_a = chartRef.current) == null ? void 0 : _a.update(getOptions(options, containerRef)));
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
if (typeof module.exports == "object" && typeof exports == "object") {
  var __cp = (to, from, except, desc) => {
    if ((from && typeof from === "object") || typeof from === "function") {
      for (let key of Object.getOwnPropertyNames(from)) {
        if (!Object.prototype.hasOwnProperty.call(to, key) && key !== except)
        Object.defineProperty(to, key, {
          get: () => from[key],
          enumerable: !(desc = Object.getOwnPropertyDescriptor(from, key)) || desc.enumerable,
        });
      }
    }
    return to;
  };
  module.exports = __cp(module.exports, exports);
}
return module.exports;
}))
