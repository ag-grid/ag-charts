/* eslint-disable sonarjs/class-name */
import type { AgInitialStateOptions } from './api/initialStateOptions';
import type { AgBaseCartesianChartOptions } from './chart/cartesianOptions';
import type { AgBaseChartOptions } from './chart/chartOptions';
import type { AgBasePolarChartOptions } from './chart/polarOptions';
import type {
    AgBaseChartThemeOptions,
    AgBaseGaugePresetThemeOptions,
    AgChartTheme,
    AgChartThemeName,
} from './chart/themeOptions';
import type { PixelSize, TContextDefault, TDatumDefault } from './chart/types';
import type { AgFinancialChartPresets } from './presets/financial/financialOptions';
import type { AgGaugePresets } from './presets/gauge/gaugeOptions';
import type { AgLinearGaugePreset } from './presets/gauge/linearGaugeOptions';
import type { AgRadialGaugePreset } from './presets/gauge/radialGaugeOptions';
import type { AgSparklineBaseThemeableOptions, AgSparklinePresets } from './presets/sparkline/sparklineOptions';
import type { AgBaseFlowProportionChartOptions } from './series/flow-proportion/flowProportionOptions';
import type { AgBaseHierarchyChartOptions } from './series/hierarchy/hierarchyOptions';
import type { AgBaseStandaloneChartOptions } from './series/standalone/standaloneOptions';
import type { AgBaseTopologyChartOptions } from './series/topology/topologyOptions';

export interface AgChartThemeOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseChartThemeOptions<TDatum, TContext> {}

export interface AgCartesianChartOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseCartesianChartOptions<TDatum, TContext>,
        AgBaseChartOptions<TDatum, TContext> {
    /**
     * A predefined theme name or an object containing theme overrides.
     *
     *
     * See: [Themes Reference](/themes-api/)
     */
    theme?: AgChartTheme<TDatum, TContext> | AgChartThemeName;
}

export interface AgPolarChartOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBasePolarChartOptions<TDatum, TContext>,
        AgBaseChartOptions<TDatum, TContext> {
    theme?: AgChartTheme<TDatum, TContext> | AgChartThemeName;
}

export interface AgHierarchyChartOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseHierarchyChartOptions<TDatum, TContext>,
        AgBaseChartOptions<TDatum, TContext> {
    theme?: AgChartTheme<TDatum, TContext> | AgChartThemeName;
}

export interface AgTopologyChartOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseTopologyChartOptions<TDatum, TContext>,
        AgBaseChartOptions<TDatum, TContext> {
    theme?: AgChartTheme<TDatum, TContext> | AgChartThemeName;
}

export interface AgFlowProportionChartOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseFlowProportionChartOptions<TDatum, TContext>,
        AgBaseChartOptions<TDatum, TContext> {
    theme?: AgChartTheme<TDatum, TContext> | AgChartThemeName;
}

export interface AgStandaloneChartOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseStandaloneChartOptions<TDatum, TContext>,
        AgBaseChartOptions<TDatum, TContext> {
    theme?: AgChartTheme<TDatum, TContext> | AgChartThemeName;
}

export interface AgGaugeChartOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseChartOptions<TDatum, TContext> {
    theme?: AgChartTheme<TDatum, TContext> | AgChartThemeName;
}

export type AgChartOptions<TDatum = TDatumDefault, TContext = TContextDefault> =
    | AgCartesianChartOptions<TDatum, TContext>
    | AgPolarChartOptions<TDatum, TContext>
    | AgHierarchyChartOptions<TDatum, TContext>
    | AgTopologyChartOptions<TDatum, TContext>
    | AgFlowProportionChartOptions<TDatum, TContext>
    | AgStandaloneChartOptions<TDatum, TContext>;

export type AgBaseFinancialPresetOptions<TDatum = TDatumDefault> = Pick<
    AgCartesianChartOptions<TDatum, never>,
    | 'container'
    | 'width'
    | 'height'
    | 'minWidth'
    | 'minHeight'
    | 'theme'
    | 'title'
    | 'initialState'
    | 'data'
    | 'listeners'
>;

export type AgBaseSparklinePresetThemeOptions<TDatum = TDatumDefault> = AgSparklineBaseThemeableOptions<TDatum> &
    Pick<
        AgCartesianChartOptions<TDatum, never>,
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
    >;

export type AgFinancialChartOptions<TDatum = TDatumDefault> = AgBaseFinancialPresetOptions<TDatum> &
    AgFinancialChartPresets;

export interface AgBaseGaugePresetOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseGaugePresetThemeOptions<TDatum, TContext> {
    theme?: AgChartTheme<TDatum, TContext> | AgChartThemeName;
    /** The element to place the rendered chart into. */
    container?: HTMLElement | null;
}

export type AgLinearGaugeOptions<TDatum = TDatumDefault, TContext = TContextDefault> = AgBaseGaugePresetOptions<
    TDatum,
    TContext
> &
    AgLinearGaugePreset<TContext>;
export type AgRadialGaugeOptions<TDatum = TDatumDefault, TContext = TContextDefault> = AgBaseGaugePresetOptions<
    TDatum,
    TContext
> &
    AgRadialGaugePreset<TContext>;
export type AgGaugeOptions<TDatum = TDatumDefault, TContext = TContextDefault> = AgBaseGaugePresetOptions<
    TDatum,
    TContext
> &
    AgGaugePresets<TContext>;

export interface AgBaseSparklinePresetOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseSparklinePresetThemeOptions<TDatum> {
    theme?: AgChartTheme<TDatum, TContext> | AgChartThemeName;
}

export type AgSparklineOptions<TDatum = TDatumDefault, TContext = TContextDefault> = AgBaseSparklinePresetOptions<
    TDatum,
    TContext
> &
    AgSparklinePresets<TDatum>;

export type AgPresetOptions<TDatum = TDatumDefault, TContext = TContextDefault> =
    | AgFinancialChartOptions<TDatum>
    | AgGaugeOptions<TDatum, TContext>
    | AgSparklineOptions<TDatum, TContext>;

export type AgChartInstanceOptions<TDatum = TDatumDefault, TContext = TContextDefault> =
    | AgChartOptions<TDatum, TContext>
    | AgPresetOptions<TDatum, TContext>;

type DeepPartial<T> = T extends Array<unknown> ? T : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export interface AgTypedChartInstance<TDatum, TContext, O extends AgChartInstanceOptions<TDatum, TContext>> {
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
    getState(): AgChartState;
    /** Sets the state of the given `AgChartInstance` to the state provided.*/
    setState(state: AgChartState): Promise<void>;

    /** Destroy the chart instance and any allocated resources supporting its rendering. */
    destroy(): void;
}

export interface AgChartInstance<
    TOptions extends AgChartInstanceOptions<TDatumDefault, TContextDefault> = AgChartOptions<
        TDatumDefault,
        TContextDefault
    >,
> extends AgTypedChartInstance<TDatumDefault, TContextDefault, TOptions> {}

// @ts-expect-error Expected to be unused in code, simplified typings to enable rendering for API docs.
interface _AgChartInstanceInterface<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgTypedChartInstance<TDatum, TContext, AgChartOptions<TDatum, TContext>> {
    update(options: AgChartOptions<TDatum, TContext>): Promise<void>;
    updateDelta(deltaOptions: AgChartOptions<TDatum, TContext>): Promise<void>;
    getOptions(): AgChartOptions<TDatum, TContext>;
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
