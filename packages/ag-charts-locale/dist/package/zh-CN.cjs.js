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

// packages/ag-charts-locale/src/zh-CN.ts
var zh_CN_exports = {};
__export(zh_CN_exports, {
  AG_CHARTS_LOCALE_ZH_CN: () => AG_CHARTS_LOCALE_ZH_CN
});
module.exports = __toCommonJS(zh_CN_exports);
var AG_CHARTS_LOCALE_ZH_CN = {
  ariaAnnounceChart: "\u56FE\u8868\uFF0C${seriesCount}[number] \u7CFB\u5217\uFF0C${caption}",
  ariaAnnounceFlowProportionLink: "\u94FE\u63A5 ${index} \u603B\u5171 ${count}\uFF0C\u4ECE ${from} \u5230 ${to}, ${sizeName} ${size}",
  ariaAnnounceFlowProportionNode: "\u8282\u70B9 ${index} \u4E4B ${count}, ${description}",
  ariaAnnounceHidden: "\u9690\u85CF",
  ariaAnnounceHierarchyDatum: "\u7EA7\u522B ${level}[number], ${count}[number] \u5B50\u9879, ${description}",
  ariaAnnounceHoverDatum: "${datum}",
  ariaAnnounceVisible: "\u53EF\u89C1",
  ariaLabelAnnotationOptionsToolbar: "\u6CE8\u91CA\u9009\u9879",
  ariaLabelAnnotationsToolbar: "\u6CE8\u91CA",
  ariaLabelLegend: "\u56FE\u4F8B",
  ariaLabelLegendItem: "${label}\uFF0C\u56FE\u4F8B\u9879 ${index}[number]\uFF0C\u5171\u6709 ${count}[number] \u4E2A",
  ariaLabelLegendItemUnknown: "\u672A\u77E5\u56FE\u4F8B\u9879\u76EE",
  ariaLabelLegendPageNext: "\u4E0B\u4E00\u9875\u56FE\u4F8B",
  ariaLabelLegendPagePrevious: "\u4E0A\u4E00\u4F20\u5947\u9875\u9762",
  ariaLabelLegendPagination: "\u56FE\u4F8B\u5206\u9875",
  ariaLabelNavigator: "\u5BFC\u822A\u5668",
  ariaLabelNavigatorMaximum: "\u6700\u5927\u503C",
  ariaLabelNavigatorMinimum: "\u6700\u5C0F\u503C",
  ariaLabelNavigatorRange: "\u8303\u56F4",
  ariaLabelRangesToolbar: "\u8303\u56F4",
  ariaLabelZoomToolbar: "\u7F29\u653E",
  ariaValuePanRange: "${min}[percent] \u81F3 ${max}[percent]",
  contextMenuDownload: "\u4E0B\u8F7D",
  contextMenuPanToCursor: "\u5E73\u79FB\u5230\u6B64\u5904",
  contextMenuToggleOtherSeries: "\u5207\u6362\u5176\u4ED6\u7CFB\u5217",
  contextMenuToggleSeriesVisibility: "\u5207\u6362\u53EF\u89C1\u6027",
  contextMenuZoomToCursor: "\u7F29\u653E\u5230\u6B64\u5904",
  overlayLoadingData: "\u6B63\u5728\u52A0\u8F7D\u6570\u636E...",
  overlayNoData: "\u6CA1\u6709\u6570\u636E\u663E\u793A",
  overlayNoVisibleSeries: "\u6CA1\u6709\u53EF\u89C1\u7684\u7CFB\u5217",
  toolbarAnnotationsClearAll: "\u6E05\u9664\u6240\u6709\u6CE8\u91CA",
  toolbarAnnotationsColor: "\u9009\u62E9\u6CE8\u91CA\u989C\u8272",
  toolbarAnnotationsDelete: "\u5220\u9664\u6CE8\u91CA",
  toolbarAnnotationsDisjointChannel: "\u4E0D\u8FDE\u63A5\u7684\u9891\u9053",
  toolbarAnnotationsHorizontalLine: "\u6C34\u5E73\u7EBF",
  toolbarAnnotationsLock: "\u9501\u5B9A\u6CE8\u91CA",
  toolbarAnnotationsParallelChannel: "\u5E73\u884C\u901A\u9053",
  toolbarAnnotationsTrendLine: "\u8D8B\u52BF\u7EBF",
  toolbarAnnotationsUnlock: "\u89E3\u9501\u6CE8\u91CA",
  toolbarAnnotationsVerticalLine: "\u5782\u76F4\u7EBF",
  toolbarRange1Month: "1\u6708",
  toolbarRange1MonthAria: "1\u4E2A\u6708",
  toolbarRange1Year: "1\u5E74",
  toolbarRange1YearAria: "1\u5E74",
  toolbarRange3Months: "3\u6708",
  toolbarRange3MonthsAria: "3\u4E2A\u6708",
  toolbarRange6Months: "6\u4E2A\u6708",
  toolbarRange6MonthsAria: "6\u4E2A\u6708",
  toolbarRangeAll: "\u5168\u90E8",
  toolbarRangeAllAria: "\u5168\u90E8",
  toolbarRangeYearToDate: "\u5E74\u521D\u81F3\u4ECA",
  toolbarRangeYearToDateAria: "\u5E74\u521D\u81F3\u4ECA",
  toolbarZoomPanEnd: "\u79FB\u81F3\u7ED3\u5C3E",
  toolbarZoomPanLeft: "\u5411\u5DE6\u79FB\u52A8",
  toolbarZoomPanRight: "\u5411\u53F3\u5E73\u79FB",
  toolbarZoomPanStart: "\u5E73\u79FB\u5230\u5F00\u59CB\u4F4D\u7F6E",
  toolbarZoomReset: "\u91CD\u7F6E\u7F29\u653E",
  toolbarZoomZoomIn: "\u653E\u5927",
  toolbarZoomZoomOut: "\u7F29\u5C0F"
};
