var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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

// packages/ag-charts-react/src/agChartsReact.ts
import * as PropTypes from "prop-types";
import { Component, createElement, createRef } from "react";
import { AgCharts } from "ag-charts-community";
var AgChartsReact = class extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.chartRef = createRef();
  }
  render() {
    return createElement("div", {
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
    const chart = AgCharts.create(options);
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
      AgCharts.update(this.chart, this.applyContainerIfNotSet(nextProps.options));
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
export {
  AgChartsReact
};
