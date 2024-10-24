import type { AgBaseChartOptions } from './chart/chartOptions';
import type {
    AgBaseChartThemeOptions,
    AgBaseGaugePresetThemeOptions,
    AgChartTheme,
    AgChartThemeName,
} from './chart/themeOptions';
import type { PixelSize } from './chart/types';
import type { AgInitialStateOptions } from './main';
import type { AgFinancialChartPresets } from './presets/financial/financialOptions';
import type { AgGaugePresets } from './presets/gauge/gaugeOptions';
import type { AgLinearGaugePreset } from './presets/gauge/linearGaugeOptions';
import type { AgRadialGaugePreset } from './presets/gauge/radialGaugeOptions';
import type {
    AgAreaSparklinePreset,
    AgBarSparklinePreset,
    AgLineSparklinePreset,
    AgSparklinePresets,
} from './presets/sparkline/sparklineOptions';
import type {
    AgBaseCartesianChartOptions,
    AgCategoryAxisOptions,
    AgGroupedCategoryAxisOptions,
    AgLogAxisOptions,
    AgNumberAxisOptions,
    AgOrdinalTimeAxisOptions,
    AgTimeAxisOptions,
} from './series/cartesian/cartesianOptions';
import type { AgBaseFlowProportionChartOptions } from './series/flow-proportion/flowProportionOptions';
import type { AgBaseHierarchyChartOptions } from './series/hierarchy/hierarchyOptions';
import type { AgBasePolarChartOptions } from './series/polar/polarOptions';
import type { AgBaseStandaloneChartOptions } from './series/standalone/standaloneOptions';
import type { AgBaseTopologyChartOptions } from './series/topology/topologyOptions';

export interface AgChartThemeOptions extends AgBaseChartThemeOptions {}

export interface AgCartesianChartOptions extends AgBaseCartesianChartOptions, AgBaseChartOptions {
    /**
     * A predefined theme name or an object containing theme overrides.
     *
     *
     * See: [Themes Reference](/themes-api/)
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
export interface AgStandaloneChartOptions extends AgBaseStandaloneChartOptions, AgBaseChartOptions {
    theme?: AgChartTheme | AgChartThemeName;
}
export interface AgGaugeChartOptions extends AgBaseChartOptions {
    theme?: AgChartTheme | AgChartThemeName;
}
export type AgChartOptions =
    | AgCartesianChartOptions
    | AgPolarChartOptions
    | AgHierarchyChartOptions
    | AgTopologyChartOptions
    | AgFlowProportionChartOptions
    | AgStandaloneChartOptions;

export type AgBaseFinancialPresetOptions = Pick<
    AgCartesianChartOptions,
    'container' | 'width' | 'height' | 'minWidth' | 'minHeight' | 'theme' | 'title' | 'initialState' | 'data'
>;

export type AgSparklineAxisOptions =
    | Omit<AgNumberAxisOptions, 'position'>
    | Omit<AgLogAxisOptions, 'position'>
    | Omit<AgCategoryAxisOptions, 'position'>
    | Omit<AgOrdinalTimeAxisOptions, 'position'>
    | Omit<AgGroupedCategoryAxisOptions, 'position'>
    | Omit<AgTimeAxisOptions, 'position'>;
export type AgBaseSparklinePresetThemeOptions = Pick<
    AgCartesianChartOptions,
    | 'background'
    | 'container'
    | 'height'
    | 'listeners'
    | 'locale'
    | 'minHeight'
    | 'minWidth'
    | 'padding'
    | 'width'
    | 'data'
> & {
    xAxis?: AgSparklineAxisOptions;
    yAxis?: AgSparklineAxisOptions;
};

export type AgFinancialChartOptions = AgBaseFinancialPresetOptions & AgFinancialChartPresets;

export interface AgBaseGaugePresetOptions extends AgBaseGaugePresetThemeOptions {
    theme?: AgChartTheme | AgChartThemeName;
}

export type AgLinearGaugeOptions = AgBaseGaugePresetOptions & AgLinearGaugePreset;
export type AgRadialGaugeOptions = AgBaseGaugePresetOptions & AgRadialGaugePreset;
export type AgGaugeOptions = AgBaseGaugePresetOptions & AgGaugePresets;

export interface AgBaseSparklinePresetOptions extends AgBaseSparklinePresetThemeOptions {
    theme?: AgChartTheme | AgChartThemeName;
}

export type AgBarSparklineOptions = AgBaseSparklinePresetOptions & AgBarSparklinePreset;
export type AgLineSparklineOptions = AgBaseSparklinePresetOptions & AgLineSparklinePreset;
export type AgAreaSparklineOptions = AgBaseSparklinePresetOptions & AgAreaSparklinePreset;
export type AgSparklineOptions = AgBaseSparklinePresetOptions & AgSparklinePresets;

export type AgPresetOptions = AgFinancialChartOptions | AgGaugeOptions | AgSparklineOptions;

export type AgChartInstanceOptions = AgChartOptions | AgPresetOptions;

type DeepPartial<T> = T extends Array<unknown> ? T : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

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

    /** Returns a representation of the current state of the given `AgChartInstance`. */
    getState(): Required<AgChartState>;
    /** Sets the state of the given `AgChartInstance` to the state provided.*/
    setState(state: AgChartState): Promise<void>;

    /** Destroy the chart instance and any allocated resources supporting its rendering. */
    destroy(): void;
}

/** NOTE: For API docs use; simplified typings to enable rendering. */
// @ts-ignore
interface _AgChartInstanceInterface extends AgChartInstance<AgChartOptions> {
    update(options: AgChartOptions): Promise<void>;
    updateDelta(deltaOptions: AgChartOptions): Promise<void>;
    getOptions(): AgChartOptions;
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

export interface AgChartState extends AgInitialStateOptions {
    version: string;
}
