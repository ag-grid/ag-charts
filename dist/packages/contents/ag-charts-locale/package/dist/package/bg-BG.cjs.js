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

// packages/ag-charts-locale/src/bg-BG.ts
var bg_BG_exports = {};
__export(bg_BG_exports, {
  AG_CHARTS_LOCALE_BG_BG: () => AG_CHARTS_LOCALE_BG_BG
});
module.exports = __toCommonJS(bg_BG_exports);
var AG_CHARTS_LOCALE_BG_BG = {
  ariaAnnounceChart: "\u0433\u0440\u0430\u0444\u0438\u043A\u0430, ${seriesCount}[number] \u0441\u0435\u0440\u0438\u0438, ${caption}",
  ariaAnnounceFlowProportionLink: "\u0432\u0440\u044A\u0437\u043A\u0430 ${index} \u043E\u0442 ${count}, \u043E\u0442 ${from} \u0434\u043E ${to}, ${sizeName} ${size}",
  ariaAnnounceFlowProportionNode: "\u0432\u044A\u0437\u0435\u043B ${index} \u043E\u0442 ${count}, ${description}",
  ariaAnnounceHidden: "\u0441\u043A\u0440\u0438\u0442",
  ariaAnnounceHierarchyDatum: "\u043D\u0438\u0432\u043E ${level}[number], ${count}[number] \u0434\u0435\u0446\u0430, ${description}",
  ariaAnnounceHoverDatum: "${datum}",
  ariaAnnounceVisible: "\u0432\u0438\u0434\u0438\u043C",
  ariaLabelAnnotationOptionsToolbar: "\u041E\u043F\u0446\u0438\u0438 \u0437\u0430 \u0430\u043D\u043E\u0442\u0430\u0446\u0438\u044F",
  ariaLabelAnnotationsToolbar: "\u0410\u043D\u043E\u0442\u0430\u0446\u0438\u0438",
  ariaLabelLegend: "\u041B\u0435\u0433\u0435\u043D\u0434\u0430",
  ariaLabelLegendItem: "${label}, \u0415\u043B\u0435\u043C\u0435\u043D\u0442 \u043E\u0442 \u043B\u0435\u0433\u0435\u043D\u0434\u0430\u0442\u0430 ${index}[number] \u043E\u0442 ${count}[number], ",
  ariaLabelLegendItemUnknown: "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u0435\u043D \u0435\u043B\u0435\u043C\u0435\u043D\u0442 \u0432 \u043B\u0435\u0433\u0435\u043D\u0434\u0430\u0442\u0430",
  ariaLabelLegendPageNext: "\u0421\u043B\u0435\u0434\u0432\u0430\u0449\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043D\u0430 \u043B\u0435\u0433\u0435\u043D\u0434\u0430\u0442\u0430",
  ariaLabelLegendPagePrevious: "\u041F\u0440\u0435\u0434\u0438\u0448\u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043D\u0430 \u043B\u0435\u0433\u0435\u043D\u0434\u0430\u0442\u0430",
  ariaLabelLegendPagination: "\u041F\u0430\u0433\u0438\u043D\u0430\u0446\u0438\u044F \u043D\u0430 \u043B\u0435\u0433\u0435\u043D\u0434\u0430\u0442\u0430",
  ariaLabelNavigator: "\u041D\u0430\u0432\u0438\u0433\u0430\u0442\u043E\u0440",
  ariaLabelNavigatorMaximum: "\u041C\u0430\u043A\u0441\u0438\u043C\u0443\u043C",
  ariaLabelNavigatorMinimum: "\u041C\u0438\u043D\u0438\u043C\u0443\u043C",
  ariaLabelNavigatorRange: "\u041E\u0431\u0445\u0432\u0430\u0442",
  ariaLabelRangesToolbar: "\u041E\u0431\u0445\u0432\u0430\u0442\u0438",
  ariaLabelZoomToolbar: "\u041C\u0430\u0449\u0430\u0431\u0438\u0440\u0430\u043D\u0435",
  ariaValuePanRange: "${min}[percent] \u0434\u043E ${max}[percent]",
  contextMenuDownload: "\u0418\u0437\u0442\u0435\u0433\u043B\u044F\u043D\u0435",
  contextMenuPanToCursor: "\u041F\u0440\u0435\u043C\u0435\u0441\u0442\u0438 \u0442\u0443\u043A",
  contextMenuToggleOtherSeries: "\u041F\u0440\u0435\u0432\u043A\u043B\u044E\u0447\u0432\u0430\u043D\u0435 \u043D\u0430 \u0434\u0440\u0443\u0433\u0438 \u0441\u0435\u0440\u0438\u0438",
  contextMenuToggleSeriesVisibility: "\u041F\u0440\u0435\u0432\u043A\u043B\u044E\u0447\u0432\u0430\u043D\u0435 \u043D\u0430 \u0432\u0438\u0434\u0438\u043C\u043E\u0441\u0442\u0442\u0430",
  contextMenuZoomToCursor: "\u0423\u0432\u0435\u043B\u0438\u0447\u0438 \u0434\u043E \u0442\u0443\u043A",
  overlayLoadingData: "\u0417\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0435 \u043D\u0430 \u0434\u0430\u043D\u043D\u0438...",
  overlayNoData: "\u041D\u044F\u043C\u0430 \u0434\u0430\u043D\u043D\u0438 \u0437\u0430 \u043F\u043E\u043A\u0430\u0437\u0432\u0430\u043D\u0435",
  overlayNoVisibleSeries: "\u041D\u044F\u043C\u0430 \u0432\u0438\u0434\u0438\u043C\u0430 \u0441\u0435\u0440\u0438\u044F",
  toolbarAnnotationsClearAll: "\u0418\u0437\u0447\u0438\u0441\u0442\u0438 \u0432\u0441\u0438\u0447\u043A\u0438 \u0430\u043D\u043E\u0442\u0430\u0446\u0438\u0438",
  toolbarAnnotationsColor: "\u0418\u0437\u0431\u0435\u0440\u0435\u0442\u0435 \u0446\u0432\u044F\u0442 \u043D\u0430 \u0430\u043D\u043E\u0442\u0430\u0446\u0438\u044F\u0442\u0430",
  toolbarAnnotationsDelete: "\u0418\u0437\u0442\u0440\u0438\u0432\u0430\u043D\u0435 \u043D\u0430 \u0430\u043D\u043E\u0442\u0430\u0446\u0438\u044F",
  toolbarAnnotationsDisjointChannel: "\u041D\u0435\u0441\u0432\u044A\u0440\u0437\u0430\u043D\u0430 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043E\u0441\u0442",
  toolbarAnnotationsHorizontalLine: "\u0425\u043E\u0440\u0438\u0437\u043E\u043D\u0442\u0430\u043B\u043D\u0430 \u043B\u0438\u043D\u0438\u044F",
  toolbarAnnotationsLock: "\u0417\u0430\u043A\u043B\u044E\u0447\u0432\u0430\u043D\u0435 \u043D\u0430 \u0430\u043D\u043E\u0442\u0430\u0446\u0438\u044F",
  toolbarAnnotationsParallelChannel: "\u041F\u0430\u0440\u0430\u043B\u0435\u043B\u0435\u043D \u043A\u0430\u043D\u0430\u043B",
  toolbarAnnotationsTrendLine: "\u0422\u0435\u043D\u0434\u0435\u043D\u0446\u0438\u044F \u043B\u0438\u043D\u0438\u044F",
  toolbarAnnotationsUnlock: "\u041E\u0442\u043A\u043B\u044E\u0447\u0432\u0430\u043D\u0435 \u043D\u0430 \u0430\u043D\u043E\u0442\u0430\u0446\u0438\u044F",
  toolbarAnnotationsVerticalLine: "\u0412\u0435\u0440\u0442\u0438\u043A\u0430\u043B\u043D\u0430 \u043B\u0438\u043D\u0438\u044F",
  toolbarRange1Month: "1\u043C",
  toolbarRange1MonthAria: "1 \u043C\u0435\u0441\u0435\u0446",
  toolbarRange1Year: "1\u0433",
  toolbarRange1YearAria: "1 \u0433\u043E\u0434\u0438\u043D\u0430",
  toolbarRange3Months: "3\u043C",
  toolbarRange3MonthsAria: "3 \u043C\u0435\u0441\u0435\u0446\u0430",
  toolbarRange6Months: "6\u043C",
  toolbarRange6MonthsAria: "6 \u043C\u0435\u0441\u0435\u0446\u0430",
  toolbarRangeAll: "\u0412\u0441\u0438\u0447\u043A\u0438",
  toolbarRangeAllAria: "\u0412\u0441\u0438\u0447\u043A\u0438",
  toolbarRangeYearToDate: "\u041E\u0442 \u043D\u0430\u0447\u0430\u043B\u043E\u0442\u043E \u043D\u0430 \u0433\u043E\u0434\u0438\u043D\u0430\u0442\u0430",
  toolbarRangeYearToDateAria: "\u0413\u043E\u0434\u0438\u043D\u0430\u0442\u0430 \u0434\u043E \u0434\u043D\u0435\u0448\u043D\u0430 \u0434\u0430\u0442\u0430",
  toolbarZoomPanEnd: "\u041F\u0440\u0435\u043C\u0435\u0441\u0442\u0432\u0430\u043D\u0435 \u0434\u043E \u043A\u0440\u0430\u044F",
  toolbarZoomPanLeft: "\u041F\u0440\u0435\u043C\u0435\u0441\u0442\u0432\u0430\u043D\u0435 \u043D\u0430\u043B\u044F\u0432\u043E",
  toolbarZoomPanRight: "\u041F\u0440\u0435\u043C\u0435\u0441\u0442\u0432\u0430\u043D\u0435 \u043D\u0430\u0434\u044F\u0441\u043D\u043E",
  toolbarZoomPanStart: "\u041F\u0440\u0438\u0434\u0432\u0438\u0436\u0432\u0430\u043D\u0435 \u0434\u043E \u043D\u0430\u0447\u0430\u043B\u043E\u0442\u043E",
  toolbarZoomReset: "\u041D\u0443\u043B\u0438\u0440\u0430\u043D\u0435 \u043D\u0430 \u0443\u0432\u0435\u043B\u0438\u0447\u0435\u043D\u0438\u0435\u0442\u043E",
  toolbarZoomZoomIn: "\u041F\u0440\u0438\u0431\u043B\u0438\u0436\u0430\u0432\u0430\u043D\u0435",
  toolbarZoomZoomOut: "\u041D\u0430\u043C\u0430\u043B\u044F\u0432\u0430\u043D\u0435 \u043D\u0430 \u043C\u0430\u0449\u0430\u0431\u0430"
};
