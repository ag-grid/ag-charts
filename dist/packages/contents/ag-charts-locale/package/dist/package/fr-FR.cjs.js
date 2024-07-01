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

// packages/ag-charts-locale/src/fr-FR.ts
var fr_FR_exports = {};
__export(fr_FR_exports, {
  AG_CHARTS_LOCALE_FR_FR: () => AG_CHARTS_LOCALE_FR_FR
});
module.exports = __toCommonJS(fr_FR_exports);
var AG_CHARTS_LOCALE_FR_FR = {
  ariaAnnounceChart: "graphique, ${seriesCount}[number] s\xE9ries, ${caption}",
  ariaAnnounceFlowProportionLink: "lien ${index} de ${count}, de ${from} \xE0 ${to}, ${sizeName} ${size}",
  ariaAnnounceFlowProportionNode: "n\u0153ud ${index} de ${count}, ${description}",
  ariaAnnounceHidden: "cach\xE9",
  ariaAnnounceHierarchyDatum: "niveau ${level}[number], ${count}[number] enfants, ${description}",
  ariaAnnounceHoverDatum: "${datum}",
  ariaAnnounceVisible: "visible",
  ariaLabelAnnotationOptionsToolbar: "Options d'annotation",
  ariaLabelAnnotationsToolbar: "Annotations",
  ariaLabelLegend: "L\xE9gende",
  ariaLabelLegendItem: "${label}, \xC9l\xE9ment de l\xE9gende ${index}[number] sur ${count}[number], ",
  ariaLabelLegendItemUnknown: "\xC9l\xE9ment de l\xE9gende inconnu",
  ariaLabelLegendPageNext: "Page de l\xE9gende suivante",
  ariaLabelLegendPagePrevious: "Page pr\xE9c\xE9dente de la l\xE9gende",
  ariaLabelLegendPagination: "Pagination des l\xE9gendes",
  ariaLabelNavigator: "Navigateur",
  ariaLabelNavigatorMaximum: "Maximum",
  ariaLabelNavigatorMinimum: "Minimum",
  ariaLabelNavigatorRange: "Plage",
  ariaLabelRangesToolbar: "Plages",
  ariaLabelZoomToolbar: "Zoom",
  ariaValuePanRange: "${min}[percent] \xE0 ${max}[percent]",
  contextMenuDownload: "T\xE9l\xE9charger",
  contextMenuPanToCursor: "Panoramique jusqu'ici",
  contextMenuToggleOtherSeries: "Basculer les autres s\xE9ries",
  contextMenuToggleSeriesVisibility: "Basculer la visibilit\xE9",
  contextMenuZoomToCursor: "Zoomer ici",
  overlayLoadingData: "Chargement des donn\xE9es...",
  overlayNoData: "Aucune donn\xE9e \xE0 afficher",
  overlayNoVisibleSeries: "Aucune s\xE9rie visible",
  toolbarAnnotationsClearAll: "Effacer toutes les annotations",
  toolbarAnnotationsColor: "Choisir la couleur de l'annotation",
  toolbarAnnotationsDelete: "Supprimer l'annotation",
  toolbarAnnotationsDisjointChannel: "Canal disjoint",
  toolbarAnnotationsHorizontalLine: "Ligne horizontale",
  toolbarAnnotationsLock: "Verrouiller l'annotation",
  toolbarAnnotationsParallelChannel: "Canal parall\xE8le",
  toolbarAnnotationsTrendLine: "Ligne de tendance",
  toolbarAnnotationsUnlock: "D\xE9verrouiller l'annotation",
  toolbarAnnotationsVerticalLine: "Ligne verticale",
  toolbarRange1Month: "1m",
  toolbarRange1MonthAria: "1 mois",
  toolbarRange1Year: "1a",
  toolbarRange1YearAria: "1 an",
  toolbarRange3Months: "3m",
  toolbarRange3MonthsAria: "3 mois",
  toolbarRange6Months: "6m",
  toolbarRange6MonthsAria: "6 mois",
  toolbarRangeAll: "Tous",
  toolbarRangeAllAria: "Tous",
  toolbarRangeYearToDate: "Depuis le d\xE9but de l'ann\xE9e",
  toolbarRangeYearToDateAria: "Ann\xE9e \xE0 ce jour",
  toolbarZoomPanEnd: "D\xE9placer jusqu'\xE0 la fin",
  toolbarZoomPanLeft: "D\xE9placer vers la gauche",
  toolbarZoomPanRight: "D\xE9placer vers la droite",
  toolbarZoomPanStart: "D\xE9placer au d\xE9but",
  toolbarZoomReset: "R\xE9initialiser le zoom",
  toolbarZoomZoomIn: "Agrandir",
  toolbarZoomZoomOut: "D\xE9zoomer"
};
