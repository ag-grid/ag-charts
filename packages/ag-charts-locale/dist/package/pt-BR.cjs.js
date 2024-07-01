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

// packages/ag-charts-locale/src/pt-BR.ts
var pt_BR_exports = {};
__export(pt_BR_exports, {
  AG_CHARTS_LOCALE_PT_BR: () => AG_CHARTS_LOCALE_PT_BR
});
module.exports = __toCommonJS(pt_BR_exports);
var AG_CHARTS_LOCALE_PT_BR = {
  ariaAnnounceChart: "gr\xE1fico, ${seriesCount}[number] s\xE9ries, ${caption}",
  ariaAnnounceFlowProportionLink: "link ${index} de ${count}, de ${from} para ${to}, ${sizeName} ${size}",
  ariaAnnounceFlowProportionNode: "n\xF3 ${index} de ${count}, ${description}",
  ariaAnnounceHidden: "oculto",
  ariaAnnounceHierarchyDatum: "n\xEDvel ${level}[number], ${count}[number] filhos, ${description}",
  ariaAnnounceHoverDatum: "${datum}",
  ariaAnnounceVisible: "vis\xEDvel",
  ariaLabelAnnotationOptionsToolbar: "Op\xE7\xF5es de Anota\xE7\xE3o",
  ariaLabelAnnotationsToolbar: "Anota\xE7\xF5es",
  ariaLabelLegend: "Legenda",
  ariaLabelLegendItem: "${label}, Item da legenda ${index}[number] de ${count}[number], ",
  ariaLabelLegendItemUnknown: "Item desconhecido da legenda",
  ariaLabelLegendPageNext: "Pr\xF3xima P\xE1gina da Legenda",
  ariaLabelLegendPagePrevious: "P\xE1gina Anterior da Legenda",
  ariaLabelLegendPagination: "Pagina\xE7\xE3o da Legenda",
  ariaLabelNavigator: "Navegador",
  ariaLabelNavigatorMaximum: "M\xE1ximo",
  ariaLabelNavigatorMinimum: "M\xEDnimo",
  ariaLabelNavigatorRange: "Intervalo",
  ariaLabelRangesToolbar: "Faixas",
  ariaLabelZoomToolbar: "Zoom",
  ariaValuePanRange: "${min}[percent] a ${max}[percent]",
  contextMenuDownload: "Baixar",
  contextMenuPanToCursor: "Mover para aqui",
  contextMenuToggleOtherSeries: "Alternar Outras S\xE9ries",
  contextMenuToggleSeriesVisibility: "Alternar Visibilidade",
  contextMenuZoomToCursor: "Dar zoom aqui",
  overlayLoadingData: "Carregando dados...",
  overlayNoData: "Sem dados para exibir",
  overlayNoVisibleSeries: "Nenhuma s\xE9rie vis\xEDvel",
  toolbarAnnotationsClearAll: "Limpar todas as anota\xE7\xF5es",
  toolbarAnnotationsColor: "Escolha a cor da anota\xE7\xE3o",
  toolbarAnnotationsDelete: "Excluir anota\xE7\xE3o",
  toolbarAnnotationsDisjointChannel: "Canal independente",
  toolbarAnnotationsHorizontalLine: "Linha horizontal",
  toolbarAnnotationsLock: "Bloquear anota\xE7\xE3o",
  toolbarAnnotationsParallelChannel: "Canal paralelo",
  toolbarAnnotationsTrendLine: "Linha de tend\xEAncia",
  toolbarAnnotationsUnlock: "Desbloquear anota\xE7\xE3o",
  toolbarAnnotationsVerticalLine: "Linha vertical",
  toolbarRange1Month: "1m",
  toolbarRange1MonthAria: "1 m\xEAs",
  toolbarRange1Year: "1a",
  toolbarRange1YearAria: "1 ano",
  toolbarRange3Months: "3m",
  toolbarRange3MonthsAria: "3 meses",
  toolbarRange6Months: "6m",
  toolbarRange6MonthsAria: "6 meses",
  toolbarRangeAll: "Todos",
  toolbarRangeAllAria: "Tudo",
  toolbarRangeYearToDate: "YTD",
  toolbarRangeYearToDateAria: "Ano at\xE9 a data",
  toolbarZoomPanEnd: "Panorar para o final",
  toolbarZoomPanLeft: "Mover para a esquerda",
  toolbarZoomPanRight: "Mover para a direita",
  toolbarZoomPanStart: "Mover para o in\xEDcio",
  toolbarZoomReset: "Redefinir o zoom",
  toolbarZoomZoomIn: "Aproximar",
  toolbarZoomZoomOut: "Diminuir zoom"
};
