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

// packages/ag-charts-types/src/main.ts
var main_exports = {};
__export(main_exports, {
  AgErrorBarSupportedSeriesTypes: () => AgErrorBarSupportedSeriesTypes,
  AgTooltipPositionType: () => AgTooltipPositionType
});
module.exports = __toCommonJS(main_exports);

// packages/ag-charts-types/src/chart/errorBarOptions.ts
var AgErrorBarSupportedSeriesTypes = ["bar", "line", "scatter"];

// packages/ag-charts-types/src/chart/navigatorOptions.ts
var __MINI_CHART_SERIES_OPTIONS = {};
var __VERIFY_MINI_CHART_SERIES_OPTIONS = void 0;
__VERIFY_MINI_CHART_SERIES_OPTIONS = __MINI_CHART_SERIES_OPTIONS;

// packages/ag-charts-types/src/chart/tooltipOptions.ts
var AgTooltipPositionType = /* @__PURE__ */ ((AgTooltipPositionType2) => {
  AgTooltipPositionType2["POINTER"] = "pointer";
  AgTooltipPositionType2["NODE"] = "node";
  AgTooltipPositionType2["TOP"] = "top";
  AgTooltipPositionType2["RIGHT"] = "right";
  AgTooltipPositionType2["BOTTOM"] = "bottom";
  AgTooltipPositionType2["LEFT"] = "left";
  AgTooltipPositionType2["TOP_LEFT"] = "top-left";
  AgTooltipPositionType2["TOP_RIGHT"] = "top-right";
  AgTooltipPositionType2["BOTTOM_RIGHT"] = "bottom-right";
  AgTooltipPositionType2["BOTTOM_LEFT"] = "bottom-left";
  return AgTooltipPositionType2;
})(AgTooltipPositionType || {});

// packages/ag-charts-types/src/chart/themeOptions.ts
var __THEME_OVERRIDES = {};
var __VERIFY_THEME_OVERRIDES = void 0;
__VERIFY_THEME_OVERRIDES = __THEME_OVERRIDES;
