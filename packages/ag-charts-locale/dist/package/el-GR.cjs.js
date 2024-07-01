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

// packages/ag-charts-locale/src/el-GR.ts
var el_GR_exports = {};
__export(el_GR_exports, {
  AG_CHARTS_LOCALE_EL_GR: () => AG_CHARTS_LOCALE_EL_GR
});
module.exports = __toCommonJS(el_GR_exports);
var AG_CHARTS_LOCALE_EL_GR = {
  ariaAnnounceChart: "\u03B3\u03C1\u03AC\u03C6\u03B7\u03BC\u03B1, ${seriesCount}[number] \u03C3\u03B5\u03B9\u03C1\u03AD\u03C2, ${caption}",
  ariaAnnounceFlowProportionLink: "\u03C3\u03CD\u03BD\u03B4\u03B5\u03C3\u03BC\u03BF\u03C2 ${index} \u03B1\u03C0\u03CC ${count}, \u03B1\u03C0\u03CC ${from} \u03C0\u03C1\u03BF\u03C2 ${to}, ${sizeName} ${size}",
  ariaAnnounceFlowProportionNode: "\u03BA\u03CC\u03BC\u03B2\u03BF\u03C2 ${index} \u03B1\u03C0\u03CC ${count}, ${description}",
  ariaAnnounceHidden: "\u03BA\u03C1\u03C5\u03C6\u03CC",
  ariaAnnounceHierarchyDatum: "\u03B5\u03C0\u03AF\u03C0\u03B5\u03B4\u03BF ${level}[number], ${count}[number] \u03C0\u03B1\u03B9\u03B4\u03B9\u03AC, ${description}",
  ariaAnnounceHoverDatum: "${datum}",
  ariaAnnounceVisible: "\u03BF\u03C1\u03B1\u03C4\u03CC",
  ariaLabelAnnotationOptionsToolbar: "\u0395\u03C0\u03B9\u03BB\u03BF\u03B3\u03AD\u03C2 \u03C3\u03C7\u03BF\u03BB\u03B9\u03B1\u03C3\u03BC\u03BF\u03CD",
  ariaLabelAnnotationsToolbar: "\u03A3\u03C7\u03BF\u03BB\u03B9\u03B1\u03C3\u03BC\u03BF\u03AF",
  ariaLabelLegend: "\u03A5\u03C0\u03CC\u03BC\u03BD\u03B7\u03BC\u03B1",
  ariaLabelLegendItem: "${label}, \u03A3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03BF \u03B8\u03C1\u03CD\u03BB\u03BF\u03C5 ${index}[number] \u03B1\u03C0\u03CC ${count}[number], ",
  ariaLabelLegendItemUnknown: "\u0386\u03B3\u03BD\u03C9\u03C3\u03C4\u03BF \u03C3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03BF \u03C5\u03C0\u03CC\u03BC\u03BD\u03B7\u03BC\u03B1",
  ariaLabelLegendPageNext: "\u0395\u03C0\u03CC\u03BC\u03B5\u03BD\u03B7 \u03A3\u03B5\u03BB\u03AF\u03B4\u03B1 \u0398\u03C1\u03CD\u03BB\u03BF\u03C5",
  ariaLabelLegendPagePrevious: "\u03A0\u03C1\u03BF\u03B7\u03B3\u03BF\u03CD\u03BC\u03B5\u03BD\u03B7 \u03A3\u03B5\u03BB\u03AF\u03B4\u03B1 \u0398\u03C1\u03CD\u03BB\u03BF\u03C5",
  ariaLabelLegendPagination: "\u03A3\u03B5\u03BB\u03B9\u03B4\u03BF\u03C0\u03BF\u03AF\u03B7\u03C3\u03B7 \u03A5\u03C0\u03CC\u03BC\u03BD\u03B7\u03BC\u03B1",
  ariaLabelNavigator: "\u03A0\u03BB\u03BF\u03B7\u03B3\u03CC\u03C2",
  ariaLabelNavigatorMaximum: "\u039C\u03AD\u03B3\u03B9\u03C3\u03C4\u03BF",
  ariaLabelNavigatorMinimum: "\u0395\u03BB\u03AC\u03C7\u03B9\u03C3\u03C4\u03BF",
  ariaLabelNavigatorRange: "\u0395\u03CD\u03C1\u03BF\u03C2",
  ariaLabelRangesToolbar: "\u0395\u03CD\u03C1\u03B7",
  ariaLabelZoomToolbar: "\u0396\u03BF\u03C5\u03BC",
  ariaValuePanRange: "${min}[percent] \u03AD\u03C9\u03C2 ${max}[percent]",
  contextMenuDownload: "\u039B\u03AE\u03C8\u03B7",
  contextMenuPanToCursor: "\u039C\u03B5\u03C4\u03B1\u03BA\u03AF\u03BD\u03B7\u03C3\u03B7 \u03B5\u03B4\u03CE",
  contextMenuToggleOtherSeries: "\u0395\u03BD\u03B1\u03BB\u03BB\u03B1\u03B3\u03AE \u03AC\u03BB\u03BB\u03C9\u03BD \u03C3\u03B5\u03B9\u03C1\u03CE\u03BD",
  contextMenuToggleSeriesVisibility: "\u0395\u03BD\u03B1\u03BB\u03BB\u03B1\u03B3\u03AE \u039F\u03C1\u03B1\u03C4\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2",
  contextMenuZoomToCursor: "\u0396\u03BF\u03C5\u03BC \u03B5\u03B4\u03CE",
  overlayLoadingData: "\u03A6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7 \u03B4\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03C9\u03BD...",
  overlayNoData: "\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03BF\u03C5\u03BD \u03B4\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03B1 \u03B3\u03B9\u03B1 \u03B5\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7",
  overlayNoVisibleSeries: "\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03B5\u03B9 \u03BF\u03C1\u03B1\u03C4\u03AE \u03C3\u03B5\u03B9\u03C1\u03AC",
  toolbarAnnotationsClearAll: "\u0394\u03B9\u03B1\u03B3\u03C1\u03B1\u03C6\u03AE \u03CC\u03BB\u03C9\u03BD \u03C4\u03C9\u03BD \u03C3\u03B7\u03BC\u03B5\u03B9\u03CE\u03C3\u03B5\u03C9\u03BD",
  toolbarAnnotationsColor: "\u0395\u03C0\u03B9\u03BB\u03AD\u03BE\u03C4\u03B5 \u03C7\u03C1\u03CE\u03BC\u03B1 \u03C3\u03C7\u03BF\u03BB\u03B9\u03B1\u03C3\u03BC\u03BF\u03CD",
  toolbarAnnotationsDelete: "\u0394\u03B9\u03B1\u03B3\u03C1\u03B1\u03C6\u03AE \u03C3\u03C7\u03BF\u03BB\u03AF\u03BF\u03C5",
  toolbarAnnotationsDisjointChannel: "\u039C\u03B7 \u03C3\u03C5\u03BD\u03B4\u03B5\u03B4\u03B5\u03BC\u03AD\u03BD\u03BF \u03BA\u03B1\u03BD\u03AC\u03BB\u03B9",
  toolbarAnnotationsHorizontalLine: "\u039F\u03C1\u03B9\u03B6\u03CC\u03BD\u03C4\u03B9\u03B1 \u03B3\u03C1\u03B1\u03BC\u03BC\u03AE",
  toolbarAnnotationsLock: "\u039A\u03BB\u03B5\u03AF\u03B4\u03C9\u03BC\u03B1 \u03C3\u03C7\u03BF\u03BB\u03B9\u03B1\u03C3\u03BC\u03BF\u03CD",
  toolbarAnnotationsParallelChannel: "\u03A0\u03B1\u03C1\u03AC\u03BB\u03BB\u03B7\u03BB\u03BF \u03BA\u03B1\u03BD\u03AC\u03BB\u03B9",
  toolbarAnnotationsTrendLine: "\u0393\u03C1\u03B1\u03BC\u03BC\u03AE \u03C4\u03AC\u03C3\u03B7\u03C2",
  toolbarAnnotationsUnlock: "\u039E\u03B5\u03BA\u03BB\u03B5\u03AF\u03B4\u03C9\u03BC\u03B1 \u03C3\u03C7\u03BF\u03BB\u03AF\u03BF\u03C5",
  toolbarAnnotationsVerticalLine: "\u039A\u03AC\u03B8\u03B5\u03C4\u03B7 \u03B3\u03C1\u03B1\u03BC\u03BC\u03AE",
  toolbarRange1Month: "1\u03BC",
  toolbarRange1MonthAria: "1 \u03BC\u03AE\u03BD\u03B1\u03C2",
  toolbarRange1Year: "1\u03AD\u03C4\u03BF\u03C2",
  toolbarRange1YearAria: "1 \u03AD\u03C4\u03BF\u03C2",
  toolbarRange3Months: "3\u03BC",
  toolbarRange3MonthsAria: "3 \u03BC\u03AE\u03BD\u03B5\u03C2",
  toolbarRange6Months: "6\u03BC",
  toolbarRange6MonthsAria: "6 \u03BC\u03AE\u03BD\u03B5\u03C2",
  toolbarRangeAll: "\u038C\u03BB\u03B1",
  toolbarRangeAllAria: "\u038C\u03BB\u03B1",
  toolbarRangeYearToDate: "\u0388\u03C4\u03BF\u03C2 \u03AD\u03C9\u03C2 \u03C3\u03AE\u03BC\u03B5\u03C1\u03B1",
  toolbarRangeYearToDateAria: "\u0388\u03C4\u03BF\u03C2 \u03BC\u03AD\u03C7\u03C1\u03B9 \u03C3\u03AE\u03BC\u03B5\u03C1\u03B1",
  toolbarZoomPanEnd: "\u039C\u03B5\u03C4\u03B1\u03BA\u03AF\u03BD\u03B7\u03C3\u03B7 \u03C3\u03C4\u03BF \u03C4\u03AD\u03BB\u03BF\u03C2",
  toolbarZoomPanLeft: "\u039C\u03B5\u03C4\u03B1\u03C4\u03CC\u03C0\u03B9\u03C3\u03B7 \u03B1\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03AC",
  toolbarZoomPanRight: "\u039C\u03B5\u03C4\u03B1\u03C4\u03CC\u03C0\u03B9\u03C3\u03B7 \u03B4\u03B5\u03BE\u03B9\u03AC",
  toolbarZoomPanStart: "\u039C\u03B5\u03C4\u03B1\u03BA\u03AF\u03BD\u03B7\u03C3\u03B7 \u03C3\u03C4\u03B7\u03BD \u03B1\u03C1\u03C7\u03AE",
  toolbarZoomReset: "\u0395\u03C0\u03B1\u03BD\u03B1\u03C6\u03BF\u03C1\u03AC \u03C4\u03B7\u03C2 \u03B5\u03C3\u03C4\u03AF\u03B1\u03C3\u03B7\u03C2",
  toolbarZoomZoomIn: "\u039C\u03B5\u03B3\u03AD\u03B8\u03C5\u03BD\u03C3\u03B7",
  toolbarZoomZoomOut: "\u03A3\u03BC\u03AF\u03BA\u03C1\u03C5\u03BD\u03C3\u03B7"
};
