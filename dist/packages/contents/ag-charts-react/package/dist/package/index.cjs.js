"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/ag-charts-react/src/index.ts
var src_exports = {};
__export(src_exports, {
  AgChartsReact: () => AgChartsReact
});
module.exports = __toCommonJS(src_exports);

// packages/ag-charts-react/src/agChartsReact.ts
var PropTypes = __toESM(require("prop-types"), 1);
var import_react = require("react");
var import_ag_charts_community = require("ag-charts-community");
var AgChartsReact = class extends import_react.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.chartRef = (0, import_react.createRef)();
  }
  render() {
    return (0, import_react.createElement)("div", {
      style: this.createStyleForDiv(),
      ref: this.chartRef
    });
  }
  createStyleForDiv() {
    return __spreadValues({
      height: "100%"
    }, this.props.containerStyle);
  }
  componentDidMount() {
    const options = this.applyContainerIfNotSet(this.props.options);
    const chart = import_ag_charts_community.AgCharts.create(options);
    this.chart = chart;
    chart.chart.waitForUpdate().then(() => {
      var _a, _b;
      return (_b = (_a = this.props).onChartReady) == null ? void 0 : _b.call(_a, chart);
    });
  }
  applyContainerIfNotSet(propsOptions) {
    if (propsOptions.container) {
      return propsOptions;
    }
    return __spreadProps(__spreadValues({}, propsOptions), { container: this.chartRef.current });
  }
  shouldComponentUpdate(nextProps) {
    this.processPropsChanges(this.props, nextProps);
    return false;
  }
  processPropsChanges(prevProps, nextProps) {
    if (this.chart) {
      import_ag_charts_community.AgCharts.update(this.chart, this.applyContainerIfNotSet(nextProps.options));
    }
  }
  componentWillUnmount() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = void 0;
    }
  }
};
AgChartsReact.propTypes = {
  options: PropTypes.object
};
