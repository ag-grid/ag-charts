import type { AgChartCaptionOptions } from './chart/chartOptions';
import type { AgChartThemePalette, AgPaletteColors } from './chart/themeOptions';

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

export interface _ITheme {
    themeNames: string[];
    themeSymbols: Record<string, symbol>;
    getChartTheme(value: unknown): IChartTheme;

    // TODO remove legacy & type symbols map
    themes: Record<string, () => IChartTheme>;
}

export interface _IUtil {
    Color: {
        new (r: number, g: number, b: number, a?: number): IColor;
        fromHSB(h: number, s: number, b: number, a?: number): IColor;
        fromString(str: string): IColor;
        validColorString(str: string): boolean;
    };
    interpolateColor(a: IColor | string, b: IColor | string): (delta: number) => string;
}
