/* eslint-disable @typescript-eslint/no-redundant-type-constituents */

/* eslint-disable sonarjs/class-name */

/* eslint-disable sonarjs/prefer-function-type */
import type { AgChartThemePalette, AgPaletteColors } from './chart/themeOptions';
import type { AgChartInstance, AgChartInstanceOptions, AgSparklineOptions } from './chartBuilderOptions';
import type {
    Arc,
    BBox,
    BandScale,
    Caption,
    Circle,
    Group,
    Line,
    LinearScale,
    Path,
    RadialColumnShape,
    Rect,
    Scene,
    Sector,
    Shape,
    TranslatableGroup,
} from './main-scene';

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
    Path: { new (): Path } & Path;
    Group: { new (): Group } & Group;
    Scene: { new (opts: { width: number; height: number }): Scene } & Scene;
    Rect: { new (): Rect } & Rect;
    BBox: { new (x: number, y: number, w: number, h: number): BBox } & BBox;
    Arc: { new (): Arc } & Arc;
    Circle: { new (): Circle } & Circle;
    Line: { new (): Line } & Line;
    Sector: { new (): Sector } & Sector;
    Shape: { new (): Shape } & Shape;
    TranslatableGroup: { new (): TranslatableGroup } & TranslatableGroup;
    RadialColumnShape: { new (): RadialColumnShape } & RadialColumnShape;
    Caption: { new (): Caption } & Caption;
    BandScale: { new (): BandScale } & BandScale;
    LinearScale: { new (): LinearScale } & LinearScale;
    toRadians(degrees: number): number;
    getRadialColumnWidth(
        startAngle: number,
        endAngle: number,
        axisOuterRadius: number,
        columnWidthRatio: number,
        maxColumnWidthRatio: number
    ): number;
}

export interface _ITheme {
    themeNames: string[];
    themeSymbols: Record<string, symbol | boolean | string>;
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
