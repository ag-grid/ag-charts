// @ag-skip-fws
import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    SelectionModule,
} from 'ag-charts-enterprise';

import type { DataType } from './data';
import { getData } from './data';

function initMyDragBox() {
    const elem = document.getElementById('myDragBox')!;
    if (elem == null) return -1;

    let downX = NaN;
    let downY = NaN;
    function toStartAndLength(start: number, end: number): [`${number}px`, `${number}px`] {
        if (start > end) {
            [start, end] = [end, start];
        }
        return [`${start}px`, `${end - start}px`];
    }
    function updateBounds(ev: { clientX: number; clientY: number }) {
        const [left, width] = toStartAndLength(downX, ev.clientX);
        const [top, height] = toStartAndLength(downY, ev.clientY);
        elem.style.left = left;
        elem.style.top = top;
        elem.style.width = width;
        elem.style.height = height;
    }

    window.addEventListener(
        'mousedown',
        (ev) => {
            if (ev.button !== 0) return;
            downX = ev.clientX;
            downY = ev.clientY;
            updateBounds(ev);
            elem.style.display = 'block';
        },
        { capture: true }
    );
    window.addEventListener(
        'mousemove',
        (ev) => {
            if (ev.button !== 0) return;
            updateBounds(ev);
        },
        { capture: true }
    );
    window.addEventListener(
        'mouseup',
        (ev) => {
            if (ev.button !== 0) return;
            elem.style.display = 'none';
        },
        { capture: true }
    );
    return 0;
}
initMyDragBox();

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    SelectionModule,
    ContextMenuModule,
]);
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    selection: {
        enabled: true,
        enableClick: true,
    },
    tooltip: {
        enabled: false,
    },
    axes: {
        y: {
            type: 'number',
            interval: {
                minSpacing: 80,
                maxSpacing: 120,
            },
        },
        x: {
            type: 'number',
            nice: false,
            interval: {
                minSpacing: 80,
                maxSpacing: 120,
            },
            label: {
                autoRotate: false,
            },
        },
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'spending',
            marker: {
                itemStyler: (params) => {
                    if (params.selectionState === 'selected') {
                        return { stroke: 'black', strokeWidth: 2, size: 15 };
                    }
                },
            },
        },
    ],
};

AgCharts.create(options);
