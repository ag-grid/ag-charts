import { AgChartThemePalette, AgChartTheme } from "./agChartTheme";

export class PastelLight extends AgChartTheme {
    readonly palette: AgChartThemePalette = {
        fills: [
            '#c16068',
            '#a2bf8a',
            '#ebcc87',
            '#80a0c3',
            '#b58dae',
            '#85c0d1'
        ],
        strokes: [
            '#874349',
            '#718661',
            '#a48f5f',
            '#5a7088',
            '#7f637a',
            '#5d8692'
        ]
    }
}