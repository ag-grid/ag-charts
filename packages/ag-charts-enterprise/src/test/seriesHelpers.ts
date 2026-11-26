import type { AgChartOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

/** The series options as the options pipeline resolves them, with the theme and module defaults applied. */
export function resolveSeries(series: object, theme?: object): Record<string, any> {
    const options = { series: [series], ...(theme == null ? {} : { theme }) } as unknown as AgChartOptions;
    const { processedOptions } = new _ModuleSupport.ChartOptions(
        options,
        {} as AgChartOptions,
        {},
        {},
        {}
    ) as unknown as { processedOptions: { series: Record<string, any>[] } };
    return processedOptions.series[0];
}

/** A heatmap row: one cell of a `columns` × `rows` grid, with a stable `id` for transactions. */
export type GridCell = { id: string; x: string | null; y: string; v: number | null };

/** Every cell of a `columns` × `rows` category grid, coloured by position. */
export function gridCells(columns: number, rows: number): GridCell[] {
    const cells: GridCell[] = [];
    for (let x = 0; x < columns; x++) {
        for (let y = 0; y < rows; y++) {
            cells.push({ id: `${x}:${y}`, x: `X${x}`, y: `Y${y}`, v: x * rows + y });
        }
    }
    return cells;
}
