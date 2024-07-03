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

// packages/ag-charts-locale/src/vi-VN.ts
var vi_VN_exports = {};
__export(vi_VN_exports, {
  AG_CHARTS_LOCALE_VI_VN: () => AG_CHARTS_LOCALE_VI_VN
});
module.exports = __toCommonJS(vi_VN_exports);
var AG_CHARTS_LOCALE_VI_VN = {
  ariaAnnounceChart: "bi\u1EC3u \u0111\u1ED3, ${seriesCount}[number] d\xE3y, ${caption}",
  ariaAnnounceFlowProportionLink: "li\xEAn k\u1EBFt ${index} c\u1EE7a ${count}, t\u1EEB ${from} \u0111\u1EBFn ${to}, ${sizeName} ${size}",
  ariaAnnounceFlowProportionNode: "n\xFAt ${index} c\u1EE7a ${count}, ${description}",
  ariaAnnounceHidden: "\u1EA9n",
  ariaAnnounceHierarchyDatum: "c\u1EA5p \u0111\u1ED9 ${level}[number], ${count}[number] con, ${description}",
  ariaAnnounceHoverDatum: "${datum}",
  ariaAnnounceVisible: "hi\u1EC3n th\u1ECB",
  ariaLabelAnnotationOptionsToolbar: "T\xF9y ch\u1ECDn Ch\xFA th\xEDch",
  ariaLabelAnnotationsToolbar: "Ch\xFA th\xEDch",
  ariaLabelLegend: "Ch\xFA gi\u1EA3i",
  ariaLabelLegendItem: "${label}, M\u1EE5c ch\xFA gi\u1EA3i ${index}[number] trong s\u1ED1 ${count}[number], ",
  ariaLabelLegendItemUnknown: "M\u1EE5c ch\xFA gi\u1EA3i kh\xF4ng x\xE1c \u0111\u1ECBnh",
  ariaLabelLegendPageNext: "Trang Ch\xFA Gi\u1EA3i Ti\u1EBFp Theo",
  ariaLabelLegendPagePrevious: "Trang Huy\u1EC1n Tho\u1EA1i Tr\u01B0\u1EDBc",
  ariaLabelLegendPagination: "Ph\xE2n trang Ch\xFA gi\u1EA3i",
  ariaLabelNavigator: "Tr\xECnh \u0111i\u1EC1u h\u01B0\u1EDBng",
  ariaLabelNavigatorMaximum: "T\u1ED1i \u0111a",
  ariaLabelNavigatorMinimum: "T\u1ED1i thi\u1EC3u",
  ariaLabelNavigatorRange: "Ph\u1EA1m vi",
  ariaLabelRangesToolbar: "Ph\u1EA1m vi",
  ariaLabelZoomToolbar: "Thu ph\xF3ng",
  ariaValuePanRange: "${min}[percent] \u0111\u1EBFn ${max}[percent]",
  contextMenuDownload: "T\u1EA3i v\u1EC1",
  contextMenuPanToCursor: "Chuy\u1EC3n \u0111\u1EBFn \u0111\xE2y",
  contextMenuToggleOtherSeries: "Chuy\u1EC3n \u0111\u1ED5i c\xE1c d\xF2ng kh\xE1c",
  contextMenuToggleSeriesVisibility: "Chuy\u1EC3n \u0111\u1ED5i Hi\u1EC3n th\u1ECB",
  contextMenuZoomToCursor: "Thu ph\xF3ng t\u1EDBi \u0111\xE2y",
  overlayLoadingData: "\u0110ang t\u1EA3i d\u1EEF li\u1EC7u...",
  overlayNoData: "Kh\xF4ng c\xF3 d\u1EEF li\u1EC7u \u0111\u1EC3 hi\u1EC3n th\u1ECB",
  overlayNoVisibleSeries: "Kh\xF4ng c\xF3 d\xE3y s\u1ED1 hi\u1EC3n th\u1ECB",
  toolbarAnnotationsClearAll: "X\xF3a t\u1EA5t c\u1EA3 ch\xFA th\xEDch",
  toolbarAnnotationsColor: "Ch\u1ECDn m\xE0u ch\xFA th\xEDch",
  toolbarAnnotationsDelete: "X\xF3a ch\xFA th\xEDch",
  toolbarAnnotationsDisjointChannel: "K\xEAnh kh\xF4ng ch\u1ED3ng ch\xE9o",
  toolbarAnnotationsHorizontalLine: "\u0110\u01B0\u1EDDng ngang",
  toolbarAnnotationsLock: "Kh\xF3a ch\xFA th\xEDch",
  toolbarAnnotationsParallelChannel: "K\xEAnh song song",
  toolbarAnnotationsTrendLine: "\u0110\u01B0\u1EDDng xu h\u01B0\u1EDBng",
  toolbarAnnotationsUnlock: "M\u1EDF kh\xF3a ch\xFA th\xEDch",
  toolbarAnnotationsVerticalLine: "\u0110\u01B0\u1EDDng th\u1EB3ng \u0111\u1EE9ng",
  toolbarRange1Month: "1th",
  toolbarRange1MonthAria: "1 th\xE1ng",
  toolbarRange1Year: "1n",
  toolbarRange1YearAria: "1 n\u0103m",
  toolbarRange3Months: "3th",
  toolbarRange3MonthsAria: "3 th\xE1ng",
  toolbarRange6Months: "6 th\xE1ng",
  toolbarRange6MonthsAria: "6 th\xE1ng",
  toolbarRangeAll: "T\u1EA5t c\u1EA3",
  toolbarRangeAllAria: "T\u1EA5t c\u1EA3",
  toolbarRangeYearToDate: "T\u1EEB \u0111\u1EA7u n\u0103m \u0111\u1EBFn nay",
  toolbarRangeYearToDateAria: "T\u1EEB \u0111\u1EA7u n\u0103m \u0111\u1EBFn nay",
  toolbarZoomPanEnd: "Di chuy\u1EC3n \u0111\u1EBFn cu\u1ED1i",
  toolbarZoomPanLeft: "Di chuy\u1EC3n sang tr\xE1i",
  toolbarZoomPanRight: "Di chuy\u1EC3n sang ph\u1EA3i",
  toolbarZoomPanStart: "Di chuy\u1EC3n ngang tr\u1EDF l\u1EA1i \u0111\u1EA7u trang",
  toolbarZoomReset: "\u0110\u1EB7t l\u1EA1i thu ph\xF3ng",
  toolbarZoomZoomIn: "Thu nh\u1ECF",
  toolbarZoomZoomOut: "Thu nh\u1ECF"
};