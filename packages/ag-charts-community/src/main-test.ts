// Undocumented APIs used by Enterprise Modules.
export * from './chart/test/axisAccessors';
export * from './chart/test/chartAccessors';
export * from './chart/test/seriesAccessors';
export * from './chart/test/utils';
export * from './chart/test/axisTestCases';
export * from './chart/test/random';
export * from './chart/test/bigintExamples';
export * from './chart/test/aggregationStubs';
export { COMMUNITY_AND_ENTERPRISE_EXAMPLES as GALLERY_EXAMPLES, type TestCase } from './chart/test/examples-gallery';
export * as CROSSLINE_EXAMPLES from './chart/crossline/test/examples';
export { getCrossLineLabelNode, getCrossLinesPlugin } from './chart/crossline/test/crossLineAccessors';
export {
    type UndocumentedChartOptions,
    type UndocumentedSeriesOptions,
    getSeriesLabelObstacles,
    withUndocumentedChartOptions,
    withUndocumentedOptions,
} from './chart/test/communitySeriesAccessors';
export * from './chart/test/examples';
export * from './chart/series/test/examples';
export * from './chart/test/findTarget';
export * from './chart/test/freezableMock';
export * from './chart/test/legendItemName';
export { themeOptionsDefFor } from './chart/mapping/themes';
export { isPresetOverridesType } from './chart/themes/chartTheme';
export * from './chart/test/shadowFixtures';
export * from './chart/test/glowCases';
export * from './chart/test/glowRender';
export * from './chart/test/glowRenderSuite';
export { byteDifference, differingBytes, expectSamePixels } from './chart/test/expectSamePixels';
export * from './chart/test/solidFills';
export { isHalfBlack, shadowAt, useFailedRootCast } from './util/test/shadowPixels';
export * from './chart/test/prepareOptions';
export { optionAt } from './module/test/moduleAccessors';
export * from './chart/test/syncFixtures';
export * from './chart/test/glowGapFixtures';
export * from './chart/test/sectorGlowJoins';
