import type { AgChartTheme, AgChartThemePalette } from 'ag-charts-types';
import { type PaletteType } from '../../module/coreModulesTypes';
import { FONT_SIZE, FONT_WEIGHT, POSITION } from './constants';
import { type DefaultColors } from './defaultColors';
export declare class ChartTheme {
    readonly palette: AgChartThemePalette;
    readonly paletteType: PaletteType;
    protected getPalette(): AgChartThemePalette;
    readonly config: any;
    private static getAxisDefaults;
    protected getChartDefaults(): {
        minHeight: number;
        minWidth: number;
        background: {
            visible: boolean;
            fill: string;
        };
        padding: {
            top: string;
            right: string;
            bottom: string;
            left: string;
        };
        keyboard: {
            enabled: boolean;
        };
        title: {
            enabled: boolean;
            text: string;
            fontWeight: FONT_WEIGHT;
            fontSize: FONT_SIZE;
            fontFamily: string;
            color: string;
            wrapping: string;
            layoutStyle: string;
            textAlign: string;
        };
        subtitle: {
            enabled: boolean;
            text: string;
            spacing: number;
            fontSize: FONT_SIZE;
            fontFamily: string;
            color: string;
            wrapping: string;
            layoutStyle: string;
            textAlign: string;
        };
        footnote: {
            enabled: boolean;
            text: string;
            spacing: number;
            fontSize: FONT_SIZE;
            fontFamily: string;
            color: string;
            wrapping: string;
            layoutStyle: string;
            textAlign: string;
        };
        legend: {
            position: POSITION;
            spacing: number;
            listeners: {};
            toggleSeries: boolean;
            item: {
                paddingX: number;
                paddingY: number;
                marker: {
                    size: number;
                    padding: number;
                };
                showSeriesStroke: boolean;
                label: {
                    color: string;
                    fontSize: FONT_SIZE;
                    fontFamily: string;
                };
            };
            reverseOrder: boolean;
            pagination: {
                marker: {
                    size: number;
                };
                activeStyle: {
                    fill: string;
                };
                inactiveStyle: {
                    fill: string;
                };
                highlightStyle: {
                    fill: string;
                };
                label: {
                    color: string;
                };
            };
        };
        tooltip: {
            enabled: boolean;
            darkTheme: string;
            range: undefined;
            delay: number;
        };
        overlays: {
            darkTheme: string;
        };
        listeners: {};
    };
    private static readonly cartesianAxisDefault;
    constructor(options?: AgChartTheme);
    private mergeOverrides;
    private createChartConfigPerChartType;
    private getDefaults;
    templateTheme<T>(themeTemplate: T): T;
    protected getDefaultColors(): DefaultColors;
    getTemplateParameters(): Map<any, any>;
}
