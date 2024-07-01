import type { AgFinancialChartPresets } from '../api/presetOptions';
import type { AgBaseCartesianChartOptions } from '../series/cartesian/cartesianOptions';
import type { AgBaseFlowProportionChartOptions } from '../series/flow-proportion/flowProportionOptions';
import type { AgBaseHierarchyChartOptions } from '../series/hierarchy/hierarchyOptions';
import type { AgBasePolarChartOptions } from '../series/polar/polarOptions';
import type { AgBaseTopologyChartOptions } from '../series/topology/topologyOptions';
import type { AgBaseChartOptions } from './chartOptions';
import type { AgBaseChartThemeOptions, AgChartTheme, AgChartThemeName } from './themeOptions';
import type { PixelSize } from './types';
export interface AgChartThemeOptions extends AgBaseChartThemeOptions {
}
export interface AgCartesianChartOptions extends AgBaseCartesianChartOptions, AgBaseChartOptions {
    /**
     * A predefined theme name or an object containing theme overrides.
     *
     * See: [Themes Reference](../themes-api/)
     */
    theme?: AgChartTheme | AgChartThemeName;
}
export interface AgPolarChartOptions extends AgBasePolarChartOptions, AgBaseChartOptions {
    theme?: AgChartTheme | AgChartThemeName;
}
export interface AgHierarchyChartOptions extends AgBaseHierarchyChartOptions, AgBaseChartOptions {
    theme?: AgChartTheme | AgChartThemeName;
}
export interface AgTopologyChartOptions extends AgBaseTopologyChartOptions, AgBaseChartOptions {
    theme?: AgChartTheme | AgChartThemeName;
}
export interface AgFlowProportionChartOptions extends AgBaseFlowProportionChartOptions, AgBaseChartOptions {
    theme?: AgChartTheme | AgChartThemeName;
}
export type AgChartOptions = AgCartesianChartOptions | AgPolarChartOptions | AgHierarchyChartOptions | AgTopologyChartOptions | AgFlowProportionChartOptions;
export type AgBasePresetOptions = Pick<AgCartesianChartOptions, 'data' | 'container' | 'width' | 'height' | 'minWidth' | 'minHeight' | 'theme' | 'title'>;
export type AgBaseFinancialPresetOptions = AgBasePresetOptions & Pick<AgCartesianChartOptions, 'initialState'>;
export type AgFinancialChartOptions = AgFinancialChartPresets & AgBaseFinancialPresetOptions;
export type AgChartInstanceOptions = AgChartOptions | AgFinancialChartOptions;
type DeepPartial<T> = T extends Array<unknown> ? T : T extends object ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : T;
export interface AgChartInstance<O extends AgChartInstanceOptions = AgChartOptions> {
    /**
     * Update an existing `AgChartInstance`. Options provided should be complete and not
     * partial.
     *
     * @returns a `Promise` that resolves once the requested change has been rendered.
     *
     * __NOTE:__ As each call could trigger a chart redraw, multiple calls in
     * quick succession could result in undesirable flickering. Callers should batch up and/or
     * debounce changes to avoid unintended partial update renderings.
     */
    update(options: O): Promise<void>;
    /**
     * Update an existing `AgChartInstance` by applying a partial set of option changes.
     *
     * @returns a `Promise` that resolves once the requested change has been rendered.
     *
     * __NOTE:__ As each call could trigger a chart redraw, each individual delta options update
     * should leave the chart in a valid options state.
     *
     * Also, multiple calls in  quick succession could result in undesirable flickering. Callers
     * should batch up and/or debounce changes to avoid unintended partial update renderings.
     */
    updateDelta(deltaOptions: DeepPartial<O>): Promise<void>;
    /** Get the `AgChartOptions` representing the current chart configuration. */
    getOptions(): O;
    /** @returns a `Promise` that resolves once any pending changes have been rendered. */
    waitForUpdate(): Promise<void>;
    /**
     * Starts a browser-based image download for the given `AgChartInstance`.
     *
     * @returns a `Promise` that resolves once the download has been initiated.
     */
    download(options?: DownloadOptions): Promise<void>;
    /** Reset animation state; treat the next AgChartInstance.update() as-if the chart is being created from scratch. */
    resetAnimations(): void;
    /** Skip animations on the next redraw. */
    skipAnimations(): void;
    /** Returns a base64-encoded image data URL for the given `AgChartInstance`.*/
    getImageDataURL(options?: ImageDataUrlOptions): Promise<string>;
    getState(): Required<AgChartState>;
    setState(state: AgChartState): Promise<void>;
    /** Destroy the chart instance and any allocated resources supporting its rendering. */
    destroy(): void;
}
export interface DownloadOptions extends ImageDataUrlOptions {
    /** Name of downloaded image file. Defaults to `image`.  */
    fileName?: string;
}
export interface ImageDataUrlOptions {
    /** Width of downloaded chart image in pixels. Defaults to current chart width. */
    width?: PixelSize;
    /** Height of downloaded chart image in pixels. Defaults to current chart height. */
    height?: PixelSize;
    /** A MIME-type string indicating the image format. The default format type is `image/png`. Options: `image/png`, `image/jpeg`.  */
    fileFormat?: string;
}
export interface AgChartState {
    version: string;
    annotations?: AgChartSerializableState;
}
export type AgChartSerializableState = any;
export {};
