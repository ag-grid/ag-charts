import type { ModuleDefinition } from 'ag-charts-core';
import { AllCartesianModule, AllCommunityModule, AllPolarModule, FinancialChartModule } from 'ag-charts-enterprise';

/**
 * What the preview charts are allowed to draw.
 *
 * Enterprise, because the theme is mostly chrome the community bundle cannot
 * draw: the navigator, the toolbars, the context menu and the annotation panel
 * are what carry the Chrome, Buttons & Inputs and Menus & Panels params, and a
 * community-only preview leaves half the editor panel editing nothing. No
 * licence key is needed - `licenseManager` suppresses the watermark on
 * localhost and on ag-grid.com, which is everywhere this page runs.
 *
 * Named bundles rather than `AllEnterpriseModule`, which would also pull maps,
 * topology, gauges and the tree series into a docs page that shows none of
 * them. The cost of choosing is that a bundle can be missed: `FinancialChartModule`
 * carries the price-volume preset and nothing else does, so without it the
 * candlestick pane rendered a title over "No data to display". A test walks the
 * preview types and checks this list answers for each one.
 *
 * Exported rather than registered here so that test can read it without the
 * registration running.
 */
export const PREVIEW_MODULES: ModuleDefinition[] = [
    AllCommunityModule,
    AllCartesianModule,
    AllPolarModule,
    FinancialChartModule,
].flat();
