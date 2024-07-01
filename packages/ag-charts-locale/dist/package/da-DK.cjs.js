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

// packages/ag-charts-locale/src/da-DK.ts
var da_DK_exports = {};
__export(da_DK_exports, {
  AG_CHARTS_LOCALE_DA_DK: () => AG_CHARTS_LOCALE_DA_DK
});
module.exports = __toCommonJS(da_DK_exports);
var AG_CHARTS_LOCALE_DA_DK = {
  ariaAnnounceChart: "diagram, ${seriesCount}[number] serier, ${caption}",
  ariaAnnounceFlowProportionLink: "link ${index} af ${count}, fra ${from} til ${to}, ${sizeName} ${size}",
  ariaAnnounceFlowProportionNode: "node ${index} af ${count}, ${description}",
  ariaAnnounceHidden: "skjult",
  ariaAnnounceHierarchyDatum: "niveau ${level}[number], ${count}[number] b\xF8rn, ${description}",
  ariaAnnounceHoverDatum: "${datum}",
  ariaAnnounceVisible: "synlig",
  ariaLabelAnnotationOptionsToolbar: "Annotationmuligheder",
  ariaLabelAnnotationsToolbar: "Annotationer",
  ariaLabelLegend: "Forklaring",
  ariaLabelLegendItem: "${label}, Forklaringspost ${index}[number] af ${count}[number], ",
  ariaLabelLegendItemUnknown: "Ukendt element i legenden",
  ariaLabelLegendPageNext: "N\xE6ste legendeside",
  ariaLabelLegendPagePrevious: "Forrige legenda-side",
  ariaLabelLegendPagination: "Legend paginering",
  ariaLabelNavigator: "Navigator",
  ariaLabelNavigatorMaximum: "Maksimum",
  ariaLabelNavigatorMinimum: "Minimum",
  ariaLabelNavigatorRange: "R\xE6kkevidde",
  ariaLabelRangesToolbar: "Omr\xE5der",
  ariaLabelZoomToolbar: "Zoom",
  ariaValuePanRange: "${min}[percent] til ${max}[percent]",
  contextMenuDownload: "Download",
  contextMenuPanToCursor: "Panorer hertil",
  contextMenuToggleOtherSeries: "Skift Andre Serier",
  contextMenuToggleSeriesVisibility: "Skift synlighed",
  contextMenuZoomToCursor: "Zoom til her",
  overlayLoadingData: "Indl\xE6ser data...",
  overlayNoData: "Ingen data at vise",
  overlayNoVisibleSeries: "Ingen synlige serier",
  toolbarAnnotationsClearAll: "Ryd alle annoteringer",
  toolbarAnnotationsColor: "V\xE6lg annoteringsfarve",
  toolbarAnnotationsDelete: "Slet annotation",
  toolbarAnnotationsDisjointChannel: "Uafh\xE6ngig kanal",
  toolbarAnnotationsHorizontalLine: "Horisontal linje",
  toolbarAnnotationsLock: "L\xE5s annotation",
  toolbarAnnotationsParallelChannel: "Parallel kanal",
  toolbarAnnotationsTrendLine: "Trendlinje",
  toolbarAnnotationsUnlock: "L\xE5s annotation op",
  toolbarAnnotationsVerticalLine: "Lodret linje",
  toolbarRange1Month: "1m",
  toolbarRange1MonthAria: "1 m\xE5ned",
  toolbarRange1Year: "1\xE5r",
  toolbarRange1YearAria: "1 \xE5r",
  toolbarRange3Months: "3 mdr",
  toolbarRange3MonthsAria: "3 m\xE5neder",
  toolbarRange6Months: "6md",
  toolbarRange6MonthsAria: "6 m\xE5neder",
  toolbarRangeAll: "Alle",
  toolbarRangeAllAria: "Alle",
  toolbarRangeYearToDate: "\xC5TD",
  toolbarRangeYearToDateAria: "\xC5r til dato",
  toolbarZoomPanEnd: "Pan til slutningen",
  toolbarZoomPanLeft: "Panorer til venstre",
  toolbarZoomPanRight: "Panor\xE9r til h\xF8jre",
  toolbarZoomPanStart: "Pan til starten",
  toolbarZoomReset: "Nulstil zoom",
  toolbarZoomZoomIn: "Zoom ind",
  toolbarZoomZoomOut: "Zoom ud"
};
