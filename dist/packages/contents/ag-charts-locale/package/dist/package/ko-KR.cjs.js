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

// packages/ag-charts-locale/src/ko-KR.ts
var ko_KR_exports = {};
__export(ko_KR_exports, {
  AG_CHARTS_LOCALE_KO_KR: () => AG_CHARTS_LOCALE_KO_KR
});
module.exports = __toCommonJS(ko_KR_exports);
var AG_CHARTS_LOCALE_KO_KR = {
  ariaAnnounceChart: "\uCC28\uD2B8, ${seriesCount}[number] \uC2DC\uB9AC\uC988, ${caption}",
  ariaAnnounceFlowProportionLink: "\uB9C1\uD06C ${index} / ${count}, ${from}\uC5D0\uC11C ${to}\uB85C, ${sizeName} ${size}",
  ariaAnnounceFlowProportionNode: "\uB178\uB4DC ${index} / ${count}, ${description}",
  ariaAnnounceHidden: "\uC228\uAE40",
  ariaAnnounceHierarchyDatum: "\uB808\uBCA8 ${level}[number], ${count}[number] \uC790\uC2DD, ${description}",
  ariaAnnounceHoverDatum: "${datum}",
  ariaAnnounceVisible: "\uBCF4\uC774\uB294",
  ariaLabelAnnotationOptionsToolbar: "\uC8FC\uC11D \uC635\uC158",
  ariaLabelAnnotationsToolbar: "\uC8FC\uC11D",
  ariaLabelLegend: "\uBC94\uB840",
  ariaLabelLegendItem: "${label}, \uBC94\uB840 \uD56D\uBAA9 ${index}[number] / ${count}[number], ",
  ariaLabelLegendItemUnknown: "\uC54C \uC218 \uC5C6\uB294 \uBC94\uB840 \uD56D\uBAA9",
  ariaLabelLegendPageNext: "\uB2E4\uC74C \uBC94\uB840 \uD398\uC774\uC9C0",
  ariaLabelLegendPagePrevious: "\uC774\uC804 \uBC94\uB840 \uD398\uC774\uC9C0",
  ariaLabelLegendPagination: "\uBC94\uB840 \uD398\uC774\uC9C0 \uB9E4\uAE40",
  ariaLabelNavigator: "\uB124\uBE44\uAC8C\uC774\uD130",
  ariaLabelNavigatorMaximum: "\uCD5C\uB300",
  ariaLabelNavigatorMinimum: "\uCD5C\uC18C",
  ariaLabelNavigatorRange: "\uBC94\uC704",
  ariaLabelRangesToolbar: "\uBC94\uC704",
  ariaLabelZoomToolbar: "\uD655\uB300",
  ariaValuePanRange: "${min}[percent]\uC5D0\uC11C ${max}[percent]\uAE4C\uC9C0",
  contextMenuDownload: "\uB2E4\uC6B4\uB85C\uB4DC",
  contextMenuPanToCursor: "\uC5EC\uAE30\uB85C \uC774\uB3D9",
  contextMenuToggleOtherSeries: "\uB2E4\uB978 \uACC4\uC5F4 \uC804\uD658",
  contextMenuToggleSeriesVisibility: "\uAC00\uC2DC\uC131 \uC804\uD658",
  contextMenuZoomToCursor: "\uC5EC\uAE30\uB85C \uD655\uB300",
  overlayLoadingData: "\uB370\uC774\uD130\uB97C \uB85C\uB4DC\uD558\uB294 \uC911...",
  overlayNoData: "\uD45C\uC2DC\uD560 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
  overlayNoVisibleSeries: "\uBCF4\uC774\uB294 \uC2DC\uB9AC\uC988\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
  toolbarAnnotationsClearAll: "\uBAA8\uB4E0 \uC8FC\uC11D \uC9C0\uC6B0\uAE30",
  toolbarAnnotationsColor: "\uC8FC\uC11D \uC0C9\uC0C1 \uC120\uD0DD",
  toolbarAnnotationsDelete: "\uC8FC\uC11D \uC0AD\uC81C",
  toolbarAnnotationsDisjointChannel: "\uBE44\uC811\uD569 \uCC44\uB110",
  toolbarAnnotationsHorizontalLine: "\uC218\uD3C9\uC120",
  toolbarAnnotationsLock: "\uC8FC\uC11D \uC7A0\uAE08",
  toolbarAnnotationsParallelChannel: "\uBCD1\uB82C \uCC44\uB110",
  toolbarAnnotationsTrendLine: "\uCD94\uC138\uC120",
  toolbarAnnotationsUnlock: "\uC8FC\uC11D \uC7A0\uAE08 \uD574\uC81C",
  toolbarAnnotationsVerticalLine: "\uC218\uC9C1\uC120",
  toolbarRange1Month: "1\uAC1C\uC6D4",
  toolbarRange1MonthAria: "1\uAC1C\uC6D4",
  toolbarRange1Year: "1\uB144",
  toolbarRange1YearAria: "1\uB144",
  toolbarRange3Months: "3\uAC1C\uC6D4",
  toolbarRange3MonthsAria: "3\uAC1C\uC6D4",
  toolbarRange6Months: "6\uAC1C\uC6D4",
  toolbarRange6MonthsAria: "6\uAC1C\uC6D4",
  toolbarRangeAll: "\uC804\uCCB4",
  toolbarRangeAllAria: "\uBAA8\uB450",
  toolbarRangeYearToDate: "\uC5F0\uCD08\uBD80\uD130 \uD604\uC7AC\uAE4C\uC9C0",
  toolbarRangeYearToDateAria: "\uC62C\uD574 \uCD08\uBD80\uD130 \uD604\uC7AC\uAE4C\uC9C0",
  toolbarZoomPanEnd: "\uB05D\uC73C\uB85C \uC774\uB3D9",
  toolbarZoomPanLeft: "\uC67C\uCABD\uC73C\uB85C \uC774\uB3D9",
  toolbarZoomPanRight: "\uC624\uB978\uCABD\uC73C\uB85C \uC774\uB3D9",
  toolbarZoomPanStart: "\uC2DC\uC791 \uC704\uCE58\uB85C \uC774\uB3D9",
  toolbarZoomReset: "\uC90C \uB9AC\uC14B",
  toolbarZoomZoomIn: "\uD655\uB300",
  toolbarZoomZoomOut: "\uCD95\uC18C"
};
