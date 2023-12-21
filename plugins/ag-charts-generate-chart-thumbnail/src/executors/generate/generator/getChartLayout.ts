import { JSDOM } from 'jsdom';

export function getChartLayout(indexHtml: string) {
    const {
        window: { document },
    } = new JSDOM(`<html><head><style></style></head><body>${indexHtml}</body></html>`);

    const chartContainers = Array.from(document.querySelectorAll<HTMLElement>('[id]'));
    const chartPositions = chartContainers.map((container) => {
        const gridArea = container.style.gridArea;
        if (gridArea === '') return { row: 0, column: 0 };

        const match = gridArea.match(/^(\d+)\s*\/\s*(\d+)$/);
        if (match == null) throw new Error(`Expected grid-area to match format of 1 / 1. Received "${gridArea}".`);

        return {
            row: +match[1] - 1,
            column: +match[2] - 1,
        };
    });

    let rows = 1;
    let columns = 1;
    chartPositions.forEach(({ row, column }) => {
        rows = Math.max(row + 1, rows);
        columns = Math.max(column + 1, columns);
    });

    return {
        rows,
        columns,
        charts: chartContainers.map((container, index) => ({
            id: container.id,
            row: chartPositions[index].row,
            column: chartPositions[index].column,
        })),
    };
}
