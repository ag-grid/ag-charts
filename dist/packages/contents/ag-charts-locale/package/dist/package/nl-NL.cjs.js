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

// packages/ag-charts-locale/src/nl-NL.ts
var nl_NL_exports = {};
__export(nl_NL_exports, {
  AG_CHARTS_LOCALE_NL_NL: () => AG_CHARTS_LOCALE_NL_NL
});
module.exports = __toCommonJS(nl_NL_exports);
var AG_CHARTS_LOCALE_NL_NL = {
  ariaAnnounceChart: "diagram, ${seriesCount}[number] reeksen, ${caption}",
  ariaAnnounceFlowProportionLink: "link ${index} van ${count}, van ${from} naar ${to}, ${sizeName} ${size}",
  ariaAnnounceFlowProportionNode: "knooppunt ${index} van ${count}, ${description}",
  ariaAnnounceHidden: "verborgen",
  ariaAnnounceHierarchyDatum: "niveau ${level}[number], ${count}[number] kinderen, ${description}",
  ariaAnnounceHoverDatum: "${datum}",
  ariaAnnounceVisible: "zichtbaar",
  ariaLabelAnnotationOptionsToolbar: "Annotatie-opties",
  ariaLabelAnnotationsToolbar: "Annotaties",
  ariaLabelLegend: "Legenda",
  ariaLabelLegendItem: "${label}, Legend-item ${index}[number] van ${count}[number], ",
  ariaLabelLegendItemUnknown: "Onbekend legende-item",
  ariaLabelLegendPageNext: "Volgende Legend Pagina",
  ariaLabelLegendPagePrevious: "Vorige Legenda Pagina",
  ariaLabelLegendPagination: "Legenda Paginering",
  ariaLabelNavigator: "Navigator",
  ariaLabelNavigatorMaximum: "Maximum",
  ariaLabelNavigatorMinimum: "Minimum",
  ariaLabelNavigatorRange: "Bereik",
  ariaLabelRangesToolbar: "Bereiken",
  ariaLabelZoomToolbar: "Zoom",
  ariaValuePanRange: "${min}[percent] tot ${max}[percent]",
  contextMenuDownload: "Downloaden",
  contextMenuPanToCursor: "Naar hier pannen",
  contextMenuToggleOtherSeries: "Andere series in-/uitschakelen",
  contextMenuToggleSeriesVisibility: "Zichtbaarheid Wijzigen",
  contextMenuZoomToCursor: "Hier inzoomen",
  overlayLoadingData: "Gegevens laden...",
  overlayNoData: "Geen gegevens om weer te geven",
  overlayNoVisibleSeries: "Geen zichtbare reeks",
  toolbarAnnotationsClearAll: "Verwijder alle annotaties",
  toolbarAnnotationsColor: "Kies annotatiekleur",
  toolbarAnnotationsDelete: "Annotatie verwijderen",
  toolbarAnnotationsDisjointChannel: "Onafhankelijk kanaal",
  toolbarAnnotationsHorizontalLine: "Horizontale lijn",
  toolbarAnnotationsLock: "Vergrendel annotatie",
  toolbarAnnotationsParallelChannel: "Parallel kanaal",
  toolbarAnnotationsTrendLine: "Trendlijn",
  toolbarAnnotationsUnlock: "Annotatie ontgrendelen",
  toolbarAnnotationsVerticalLine: "Verticale lijn",
  toolbarRange1Month: "1m",
  toolbarRange1MonthAria: "1 maand",
  toolbarRange1Year: "1j",
  toolbarRange1YearAria: "1 jaar",
  toolbarRange3Months: "3m",
  toolbarRange3MonthsAria: "3 maanden",
  toolbarRange6Months: "6 mnd",
  toolbarRange6MonthsAria: "6 maanden",
  toolbarRangeAll: "Alles",
  toolbarRangeAllAria: "Alles",
  toolbarRangeYearToDate: "JTD",
  toolbarRangeYearToDateAria: "Jaar tot nu toe",
  toolbarZoomPanEnd: "Naar het einde pannen",
  toolbarZoomPanLeft: "Links pannen",
  toolbarZoomPanRight: "Naar rechts pannen",
  toolbarZoomPanStart: "Scroll naar het begin",
  toolbarZoomReset: "Zoom resetten",
  toolbarZoomZoomIn: "Inzoomen",
  toolbarZoomZoomOut: "Uitzoomen"
};
