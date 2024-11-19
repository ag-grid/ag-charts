import type { AgChartCaptionOptions } from './chart/chartOptions';
import type { AgChartThemePalette, AgPaletteColors } from './chart/themeOptions';
import type { AgChartInstance, AgChartInstanceOptions, AgSparklineOptions } from './chartBuilderOptions';

export interface IColor {
    r: number;
    g: number;
    b: number;
    a: number;

    toHexString(): string;
    toHSB(): [number, number, number];
    toRgbaString(fractionDigits?: number): string;
    toString(): string;
}

export interface IChartTheme {
    palette: Required<AgChartThemePalette> & {
        altUp: AgPaletteColors;
        altDown: AgPaletteColors;
        altNeutral: AgPaletteColors;
    };
    getTemplateParameters(): Map<symbol, any>;
}

// eslint-disable-next-line sonarjs/class-name
export interface _IScene {
    toRadians(degrees: number): number;
    getRadialColumnWidth(
        startAngle: number,
        endAngle: number,
        axisOuterRadius: number,
        columnWidthRatio: number,
        maxColumnWidthRatio: number
    ): number;

    Caption: AgChartCaptionOptions;
}

// eslint-disable-next-line sonarjs/class-name
export interface _ITheme {
    themeNames: string[];
    themeSymbols: Record<string, symbol>;
    getChartTheme(value: unknown): IChartTheme;

    // TODO remove legacy & type symbols map
    themes: Record<string, () => IChartTheme>;
}

// eslint-disable-next-line sonarjs/class-name
export interface _IUtil {
    Color: {
        new (r: number, g: number, b: number, a?: number): IColor;
        fromHSB(h: number, s: number, b: number, a?: number): IColor;
        fromString(str: string): IColor;
        validColorString(str: string): boolean;
    };
    interpolateColor(a: IColor | string, b: IColor | string): (delta: number) => string;
}

export interface IntegratedModule {
    VERSION: string;
    _Scene: _IScene;
    _Theme: _ITheme;
    _Util: _IUtil;
    create(options: AgChartInstanceOptions): AgChartInstance<AgChartInstanceOptions>;
    createSparkline(options: AgSparklineOptions): AgChartInstance<AgSparklineOptions>;
    setup(): void;
    setGridContext(gridContext: boolean): void;
    setLicenseKey(licenseKey: string): void;
    isEnterprise: boolean;
}
