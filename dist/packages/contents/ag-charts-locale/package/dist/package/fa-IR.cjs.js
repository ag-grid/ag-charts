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

// packages/ag-charts-locale/src/fa-IR.ts
var fa_IR_exports = {};
__export(fa_IR_exports, {
  AG_CHARTS_LOCALE_FA_IR: () => AG_CHARTS_LOCALE_FA_IR
});
module.exports = __toCommonJS(fa_IR_exports);
var AG_CHARTS_LOCALE_FA_IR = {
  ariaAnnounceChart: "\u0646\u0645\u0648\u062F\u0627\u0631\u060C ${seriesCount}[number] \u0633\u0631\u06CC\u060C ${caption}",
  ariaAnnounceFlowProportionLink: "\u0644\u06CC\u0646\u06A9 ${index} \u0627\u0632 ${count}\u060C \u0627\u0632 ${from} \u0628\u0647 ${to}\u060C ${sizeName} ${size}",
  ariaAnnounceFlowProportionNode: "\u06AF\u0631\u0647 ${index} \u0627\u0632 ${count}\u060C ${description}",
  ariaAnnounceHidden: "\u067E\u0646\u0647\u0627\u0646",
  ariaAnnounceHierarchyDatum: "\u0633\u0637\u062D ${level}[number]\u060C ${count}[number] \u0641\u0631\u0632\u0646\u062F\u060C ${description}",
  ariaAnnounceHoverDatum: "${datum}",
  ariaAnnounceVisible: "\u0642\u0627\u0628\u0644 \u0645\u0634\u0627\u0647\u062F\u0647",
  ariaLabelAnnotationOptionsToolbar: "\u06AF\u0632\u06CC\u0646\u0647\u200C\u0647\u0627\u06CC \u062D\u0627\u0634\u06CC\u0647\u200C\u0646\u0648\u06CC\u0633\u06CC",
  ariaLabelAnnotationsToolbar: "\u062D\u0627\u0634\u06CC\u0647\u200C\u0646\u0648\u06CC\u0633\u06CC\u200C\u0647\u0627",
  ariaLabelLegend: "\u0631\u0627\u0647\u0646\u0645\u0627",
  ariaLabelLegendItem: "${label}\u060C \u0627\u0641\u0633\u0627\u0646\u0647 \u0645\u0648\u0631\u062F ${index}[number] \u0627\u0632 ${count}[number]\u060C ",
  ariaLabelLegendItemUnknown: "\u0645\u0648\u0631\u062F \u0646\u0627\u0634\u0646\u0627\u062E\u062A\u0647 \u062F\u0631 \u0641\u0647\u0631\u0633\u062A \u0639\u0644\u0627\u0626\u0645",
  ariaLabelLegendPageNext: "\u0635\u0641\u062D\u0647 \u0628\u0639\u062F\u06CC \u0631\u0627\u0647\u0646\u0645\u0627",
  ariaLabelLegendPagePrevious: "\u0635\u0641\u062D\u0647 \u0642\u0628\u0644\u06CC \u0627\u0641\u0633\u0627\u0646\u0647",
  ariaLabelLegendPagination: "\u0635\u0641\u062D\u0647\u200C\u0628\u0646\u062F\u06CC \u0631\u0627\u0647\u0646\u0645\u0627",
  ariaLabelNavigator: "\u062C\u0647\u062A\u200C\u06CC\u0627\u0628",
  ariaLabelNavigatorMaximum: "\u062D\u062F\u0627\u06A9\u062B\u0631",
  ariaLabelNavigatorMinimum: "\u062D\u062F\u0627\u0642\u0644",
  ariaLabelNavigatorRange: "\u0645\u062D\u062F\u0648\u062F\u0647",
  ariaLabelRangesToolbar: "\u0645\u062D\u062F\u0648\u062F\u0647\u200C\u0647\u0627",
  ariaLabelZoomToolbar: "\u0628\u0632\u0631\u06AF\u0646\u0645\u0627\u06CC\u06CC",
  ariaValuePanRange: "${min}[percent] \u062A\u0627 ${max}[percent]",
  contextMenuDownload: "\u062F\u0627\u0646\u0644\u0648\u062F",
  contextMenuPanToCursor: "\u062D\u0631\u06A9\u062A \u0628\u0647 \u0627\u06CC\u0646\u062C\u0627",
  contextMenuToggleOtherSeries: "\u062A\u063A\u06CC\u06CC\u0631 \u0648\u0636\u0639\u06CC\u062A \u0633\u0627\u06CC\u0631 \u0633\u0631\u06CC\u200C\u0647\u0627",
  contextMenuToggleSeriesVisibility: "\u062A\u063A\u06CC\u06CC\u0631 \u0646\u0645\u0627\u06CC\u0634",
  contextMenuZoomToCursor: "\u0632\u0648\u0645 \u0628\u0647 \u0627\u06CC\u0646\u062C\u0627",
  overlayLoadingData: "\u062F\u0631 \u062D\u0627\u0644 \u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC \u062F\u0627\u062F\u0647...",
  overlayNoData: "\u062F\u0627\u062F\u0647\u200C\u0627\u06CC \u0628\u0631\u0627\u06CC \u0646\u0645\u0627\u06CC\u0634 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F",
  overlayNoVisibleSeries: "\u0633\u0631\u06CC \u0642\u0627\u0628\u0644 \u0645\u0634\u0627\u0647\u062F\u0647\u200C\u0627\u06CC \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F",
  toolbarAnnotationsClearAll: "\u067E\u0627\u06A9 \u06A9\u0631\u062F\u0646 \u0647\u0645\u0647 \u06CC\u0627\u062F\u062F\u0627\u0634\u062A\u200C\u0647\u0627",
  toolbarAnnotationsColor: "\u0627\u0646\u062A\u062E\u0627\u0628 \u0631\u0646\u06AF \u062D\u0627\u0634\u06CC\u0647 \u0646\u0648\u06CC\u0633\u06CC",
  toolbarAnnotationsDelete: "\u062D\u0630\u0641 \u062D\u0627\u0634\u06CC\u0647\u200C\u0646\u0648\u06CC\u0633\u06CC",
  toolbarAnnotationsDisjointChannel: "\u06A9\u0627\u0646\u0627\u0644 \u0645\u062C\u0632\u0627",
  toolbarAnnotationsHorizontalLine: "\u062E\u0637 \u0627\u0641\u0642\u06CC",
  toolbarAnnotationsLock: "\u0642\u0641\u0644 \u06A9\u0631\u062F\u0646 \u062D\u0627\u0634\u06CC\u0647\u200C\u0646\u0648\u06CC\u0633\u06CC",
  toolbarAnnotationsParallelChannel: "\u06A9\u0627\u0646\u0627\u0644 \u0645\u0648\u0627\u0632\u06CC",
  toolbarAnnotationsTrendLine: "\u062E\u0637 \u0631\u0648\u0646\u062F",
  toolbarAnnotationsUnlock: "\u0628\u0627\u0632 \u06A9\u0631\u062F\u0646 \u06CC\u0627\u062F\u062F\u0627\u0634\u062A",
  toolbarAnnotationsVerticalLine: "\u062E\u0637 \u0639\u0645\u0648\u062F\u06CC",
  toolbarRange1Month: "\u06F1\u0645",
  toolbarRange1MonthAria: "\u06F1 \u0645\u0627\u0647",
  toolbarRange1Year: "\u06F1 \u0633\u0627\u0644",
  toolbarRange1YearAria: "\u06F1 \u0633\u0627\u0644",
  toolbarRange3Months: "\u06F3 \u0645\u0627\u0647",
  toolbarRange3MonthsAria: "\u06F3 \u0645\u0627\u0647",
  toolbarRange6Months: "\u06F6 \u0645\u0627\u0647",
  toolbarRange6MonthsAria: "\u06F6 \u0645\u0627\u0647",
  toolbarRangeAll: "\u0647\u0645\u0647",
  toolbarRangeAllAria: "\u0647\u0645\u0647",
  toolbarRangeYearToDate: "\u0627\u0632 \u0627\u0628\u062A\u062F\u0627\u06CC \u0633\u0627\u0644",
  toolbarRangeYearToDateAria: "\u0627\u0632 \u0627\u0628\u062A\u062F\u0627\u06CC \u0633\u0627\u0644 \u062A\u0627 \u06A9\u0646\u0648\u0646",
  toolbarZoomPanEnd: "\u062D\u0631\u06A9\u062A \u0628\u0647 \u0627\u0646\u062A\u0647\u0627",
  toolbarZoomPanLeft: "\u062D\u0631\u06A9\u062A \u0628\u0647 \u0686\u067E",
  toolbarZoomPanRight: "\u062D\u0631\u06A9\u062A \u0628\u0647 \u0631\u0627\u0633\u062A",
  toolbarZoomPanStart: "\u062C\u0627\u0628\u062C\u0627\u06CC\u06CC \u0628\u0647 \u0627\u0628\u062A\u062F\u0627",
  toolbarZoomReset: "\u0628\u0627\u0632\u0646\u0634\u0627\u0646\u06CC \u0628\u0632\u0631\u06AF\u200C\u0646\u0645\u0627\u06CC\u06CC",
  toolbarZoomZoomIn: "\u0628\u0632\u0631\u06AF\u0646\u0645\u0627\u06CC\u06CC",
  toolbarZoomZoomOut: "\u0628\u0632\u0631\u06AF\u0646\u0645\u0627\u06CC\u06CC \u06A9\u0645\u062A\u0631"
};