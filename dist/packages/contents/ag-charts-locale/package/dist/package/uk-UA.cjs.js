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

// packages/ag-charts-locale/src/uk-UA.ts
var uk_UA_exports = {};
__export(uk_UA_exports, {
  AG_CHARTS_LOCALE_UK_UA: () => AG_CHARTS_LOCALE_UK_UA
});
module.exports = __toCommonJS(uk_UA_exports);
var AG_CHARTS_LOCALE_UK_UA = {
  ariaAnnounceChart: "\u0434\u0456\u0430\u0433\u0440\u0430\u043C\u0430, ${seriesCount}[number] \u0441\u0435\u0440\u0456\u0439, ${caption}",
  ariaAnnounceFlowProportionLink: "\u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F ${index} \u0437 ${count}, \u0432\u0456\u0434 ${from} \u0434\u043E ${to}, ${sizeName} ${size}",
  ariaAnnounceFlowProportionNode: "\u0432\u0443\u0437\u043E\u043B ${index} \u0437 ${count}, ${description}",
  ariaAnnounceHidden: "\u043F\u0440\u0438\u0445\u043E\u0432\u0430\u043D\u043E",
  ariaAnnounceHierarchyDatum: "\u0440\u0456\u0432\u0435\u043D\u044C ${level}[number], ${count}[number] \u0434\u043E\u0447\u0456\u0440\u043D\u0456, ${description}",
  ariaAnnounceHoverDatum: "${datum}",
  ariaAnnounceVisible: "\u0432\u0438\u0434\u0438\u043C\u0438\u0439",
  ariaLabelAnnotationOptionsToolbar: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0438 \u0430\u043D\u043E\u0442\u0430\u0446\u0456\u0439",
  ariaLabelAnnotationsToolbar: "\u0410\u043D\u043E\u0442\u0430\u0446\u0456\u0457",
  ariaLabelLegend: "\u041B\u0435\u0433\u0435\u043D\u0434\u0430",
  ariaLabelLegendItem: "${label}, \u0415\u043B\u0435\u043C\u0435\u043D\u0442 \u043B\u0435\u0433\u0435\u043D\u0434\u0438 ${index}[number] \u0437 ${count}[number], ",
  ariaLabelLegendItemUnknown: "\u041D\u0435\u0432\u0456\u0434\u043E\u043C\u0438\u0439 \u0435\u043B\u0435\u043C\u0435\u043D\u0442 \u043B\u0435\u0433\u0435\u043D\u0434\u0438",
  ariaLabelLegendPageNext: "\u041D\u0430\u0441\u0442\u0443\u043F\u043D\u0430 \u0441\u0442\u043E\u0440\u0456\u043D\u043A\u0430 \u043B\u0435\u0433\u0435\u043D\u0434\u0438",
  ariaLabelLegendPagePrevious: "\u041F\u043E\u043F\u0435\u0440\u0435\u0434\u043D\u044F \u0441\u0442\u043E\u0440\u0456\u043D\u043A\u0430 \u043B\u0435\u0433\u0435\u043D\u0434\u0438",
  ariaLabelLegendPagination: "\u041F\u0430\u0433\u0456\u043D\u0430\u0446\u0456\u044F \u043B\u0435\u0433\u0435\u043D\u0434\u0438",
  ariaLabelNavigator: "\u041D\u0430\u0432\u0456\u0433\u0430\u0442\u043E\u0440",
  ariaLabelNavigatorMaximum: "\u041C\u0430\u043A\u0441\u0438\u043C\u0443\u043C",
  ariaLabelNavigatorMinimum: "\u041C\u0456\u043D\u0456\u043C\u0443\u043C",
  ariaLabelNavigatorRange: "\u0414\u0456\u0430\u043F\u0430\u0437\u043E\u043D",
  ariaLabelRangesToolbar: "\u0414\u0456\u0430\u043F\u0430\u0437\u043E\u043D\u0438",
  ariaLabelZoomToolbar: "\u041C\u0430\u0441\u0448\u0442\u0430\u0431",
  ariaValuePanRange: "${min}[percent] \u0434\u043E ${max}[percent]",
  contextMenuDownload: "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438",
  contextMenuPanToCursor: "\u041F\u0440\u043E\u043A\u0440\u0443\u0442\u0438\u0442\u0438 \u0441\u044E\u0434\u0438",
  contextMenuToggleOtherSeries: "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u0438 \u0456\u043D\u0448\u0456 \u0441\u0435\u0440\u0456\u0457",
  contextMenuToggleSeriesVisibility: "\u041F\u0435\u0440\u0435\u043C\u043A\u043D\u0443\u0442\u0438 \u0432\u0438\u0434\u0438\u043C\u0456\u0441\u0442\u044C",
  contextMenuZoomToCursor: "\u0417\u0431\u0456\u043B\u044C\u0448\u0438\u0442\u0438 \u0441\u044E\u0434\u0438",
  overlayLoadingData: "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u0434\u0430\u043D\u0438\u0445...",
  overlayNoData: "\u041D\u0435\u043C\u0430\u0454 \u0434\u0430\u043D\u0438\u0445 \u0434\u043B\u044F \u0432\u0456\u0434\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u043D\u044F",
  overlayNoVisibleSeries: "\u041D\u0435\u043C\u0430\u0454 \u0432\u0438\u0434\u0438\u043C\u0438\u0445 \u0441\u0435\u0440\u0456\u0439",
  toolbarAnnotationsClearAll: "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u0438 \u0432\u0441\u0456 \u0430\u043D\u043E\u0442\u0430\u0446\u0456\u0457",
  toolbarAnnotationsColor: "\u0412\u0438\u0431\u0435\u0440\u0456\u0442\u044C \u043A\u043E\u043B\u0456\u0440 \u0430\u043D\u043E\u0442\u0430\u0446\u0456\u0457",
  toolbarAnnotationsDelete: "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438 \u0430\u043D\u043E\u0442\u0430\u0446\u0456\u044E",
  toolbarAnnotationsDisjointChannel: "\u0420\u043E\u0437\u0434\u0456\u043B\u0435\u043D\u0438\u0439 \u043A\u0430\u043D\u0430\u043B",
  toolbarAnnotationsHorizontalLine: "\u0413\u043E\u0440\u0438\u0437\u043E\u043D\u0442\u0430\u043B\u044C\u043D\u0430 \u043B\u0456\u043D\u0456\u044F",
  toolbarAnnotationsLock: "\u0417\u0430\u0431\u043B\u043E\u043A\u0443\u0432\u0430\u0442\u0438 \u0430\u043D\u043E\u0442\u0430\u0446\u0456\u044E",
  toolbarAnnotationsParallelChannel: "\u041F\u0430\u0440\u0430\u043B\u0435\u043B\u044C\u043D\u0438\u0439 \u043A\u0430\u043D\u0430\u043B",
  toolbarAnnotationsTrendLine: "\u0422\u0440\u0435\u043D\u0434\u043E\u0432\u0430 \u043B\u0456\u043D\u0456\u044F",
  toolbarAnnotationsUnlock: "\u0420\u043E\u0437\u0431\u043B\u043E\u043A\u0443\u0432\u0430\u0442\u0438 \u0430\u043D\u043E\u0442\u0430\u0446\u0456\u044E",
  toolbarAnnotationsVerticalLine: "\u0412\u0435\u0440\u0442\u0438\u043A\u0430\u043B\u044C\u043D\u0430 \u043B\u0456\u043D\u0456\u044F",
  toolbarRange1Month: "1\u043C",
  toolbarRange1MonthAria: "1 \u043C\u0456\u0441\u044F\u0446\u044C",
  toolbarRange1Year: "1\u0440",
  toolbarRange1YearAria: "1 \u0440\u0456\u043A",
  toolbarRange3Months: "3\u043C",
  toolbarRange3MonthsAria: "3 \u043C\u0456\u0441\u044F\u0446\u0456",
  toolbarRange6Months: "6\u043C",
  toolbarRange6MonthsAria: "6 \u043C\u0456\u0441\u044F\u0446\u0456\u0432",
  toolbarRangeAll: "\u0412\u0441\u0456",
  toolbarRangeAllAria: "\u0412\u0441\u0456",
  toolbarRangeYearToDate: "\u0417 \u043F\u043E\u0447\u0430\u0442\u043A\u0443 \u0440\u043E\u043A\u0443",
  toolbarRangeYearToDateAria: "\u0417 \u043F\u043E\u0447\u0430\u0442\u043A\u0443 \u0440\u043E\u043A\u0443",
  toolbarZoomPanEnd: "\u041F\u0435\u0440\u0435\u043C\u0456\u0441\u0442\u0438\u0442\u0438 \u0434\u043E \u043A\u0456\u043D\u0446\u044F",
  toolbarZoomPanLeft: "\u041F\u0430\u043D\u043E\u0440\u0430\u043C\u0430 \u0432\u043B\u0456\u0432\u043E",
  toolbarZoomPanRight: "\u041F\u0435\u0440\u0435\u043C\u0456\u0441\u0442\u0438\u0442\u0438 \u0432\u043F\u0440\u0430\u0432\u043E",
  toolbarZoomPanStart: "\u041F\u0430\u043D\u043E\u0440\u0430\u043C\u0443\u0432\u0430\u0442\u0438 \u043D\u0430 \u043F\u043E\u0447\u0430\u0442\u043E\u043A",
  toolbarZoomReset: "\u0421\u043A\u0438\u043D\u0443\u0442\u0438 \u043C\u0430\u0441\u0448\u0442\u0430\u0431\u0443\u0432\u0430\u043D\u043D\u044F",
  toolbarZoomZoomIn: "\u0417\u0431\u0456\u043B\u044C\u0448\u0438\u0442\u0438",
  toolbarZoomZoomOut: "\u0417\u043C\u0435\u043D\u0448\u0438\u0442\u0438 \u043C\u0430\u0441\u0448\u0442\u0430\u0431"
};