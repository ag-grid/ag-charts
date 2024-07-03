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

// packages/ag-charts-locale/src/hu-HU.ts
var hu_HU_exports = {};
__export(hu_HU_exports, {
  AG_CHARTS_LOCALE_HU_HU: () => AG_CHARTS_LOCALE_HU_HU
});
module.exports = __toCommonJS(hu_HU_exports);
var AG_CHARTS_LOCALE_HU_HU = {
  ariaAnnounceChart: "diagram, ${seriesCount}[number] sorozat, ${caption}",
  ariaAnnounceFlowProportionLink: "hivatkoz\xE1s ${index} a(z) ${count} k\xF6z\xFCl, ${from}-t\xF3l ${to}-ig, ${sizeName} ${size}",
  ariaAnnounceFlowProportionNode: "${count} k\xF6z\xFCl ${index} csom\xF3pont, ${description}",
  ariaAnnounceHidden: "rejtett",
  ariaAnnounceHierarchyDatum: "szint ${level}[number], ${count}[number] gyermek, ${description}",
  ariaAnnounceHoverDatum: "${datum}",
  ariaAnnounceVisible: "l\xE1that\xF3",
  ariaLabelAnnotationOptionsToolbar: "Jel\xF6l\xE9si lehet\u0151s\xE9gek",
  ariaLabelAnnotationsToolbar: "Jel\xF6l\xE9sek",
  ariaLabelLegend: "Jelmagyar\xE1zat",
  ariaLabelLegendItem: "${label}, Jelmagyar\xE1zat elem ${index}[number] a(z) ${count}[number] k\xF6z\xFCl, ",
  ariaLabelLegendItemUnknown: "Ismeretlen jelmagyar\xE1zati elem",
  ariaLabelLegendPageNext: "K\xF6vetkez\u0151 jelmagyar\xE1zat oldal",
  ariaLabelLegendPagePrevious: "El\u0151z\u0151 jelmagyar\xE1zat oldal",
  ariaLabelLegendPagination: "Jelmagyar\xE1zat Lapoz\xE1s",
  ariaLabelNavigator: "Navig\xE1tor",
  ariaLabelNavigatorMaximum: "Maximum",
  ariaLabelNavigatorMinimum: "Minimum",
  ariaLabelNavigatorRange: "Tartom\xE1ny",
  ariaLabelRangesToolbar: "Tartom\xE1nyok",
  ariaLabelZoomToolbar: "Nagy\xEDt\xE1s",
  ariaValuePanRange: "${min}[percent] \xE9s ${max}[percent] k\xF6z\xF6tt",
  contextMenuDownload: "Let\xF6lt\xE9s",
  contextMenuPanToCursor: "P\xE1szt\xE1z\xE1s ide",
  contextMenuToggleOtherSeries: "Tov\xE1bbi sorozatok megjelen\xEDt\xE9se/elrejt\xE9se",
  contextMenuToggleSeriesVisibility: "L\xE1that\xF3s\xE1g v\xE1lt\xE1sa",
  contextMenuZoomToCursor: "Nagy\xEDt\xE1s ide",
  overlayLoadingData: "Adatok bet\xF6lt\xE9se...",
  overlayNoData: "Nincs megjelen\xEDthet\u0151 adat",
  overlayNoVisibleSeries: "Nincs l\xE1that\xF3 sorozat",
  toolbarAnnotationsClearAll: "Minden megjegyz\xE9s t\xF6rl\xE9se",
  toolbarAnnotationsColor: "V\xE1lassza ki az annot\xE1ci\xF3 sz\xEDn\xE9t",
  toolbarAnnotationsDelete: "Jegyzet t\xF6rl\xE9se",
  toolbarAnnotationsDisjointChannel: "K\xFCl\xF6n\xE1ll\xF3 csatorna",
  toolbarAnnotationsHorizontalLine: "V\xEDzszintes vonal",
  toolbarAnnotationsLock: "Jegyzet z\xE1rol\xE1sa",
  toolbarAnnotationsParallelChannel: "P\xE1rhuzamos csatorna",
  toolbarAnnotationsTrendLine: "Trendvonal",
  toolbarAnnotationsUnlock: "Jegyzet felold\xE1sa",
  toolbarAnnotationsVerticalLine: "F\xFCgg\u0151leges vonal",
  toolbarRange1Month: "1h",
  toolbarRange1MonthAria: "1 h\xF3nap",
  toolbarRange1Year: "1 \xE9v",
  toolbarRange1YearAria: "1 \xE9v",
  toolbarRange3Months: "3h",
  toolbarRange3MonthsAria: "3 h\xF3nap",
  toolbarRange6Months: "6 h\xF3nap",
  toolbarRange6MonthsAria: "6 h\xF3nap",
  toolbarRangeAll: "\xD6sszes",
  toolbarRangeAllAria: "\xD6sszes",
  toolbarRangeYearToDate: "\xC9v elej\xE9t\u0151l",
  toolbarRangeYearToDateAria: "\xC9v elej\xE9t\u0151l",
  toolbarZoomPanEnd: "G\xF6rget\xE9s a v\xE9g\xE9re",
  toolbarZoomPanLeft: "Balra mozgat\xE1s",
  toolbarZoomPanRight: "Jobbra g\xF6rd\xEDt\xE9s",
  toolbarZoomPanStart: "Lapoz\xE1s az elej\xE9re",
  toolbarZoomReset: "Nagy\xEDt\xE1s vissza\xE1ll\xEDt\xE1sa",
  toolbarZoomZoomIn: "Nagy\xEDt\xE1s",
  toolbarZoomZoomOut: "Kicsiny\xEDt\xE9s"
};