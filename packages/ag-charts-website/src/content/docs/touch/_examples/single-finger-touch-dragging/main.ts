import { AgCartesianChartOptions, AgCharts, AgTouchOptions } from 'ag-charts-enterprise';

import { getData } from './data';

function initAnimation() {
    const f = () => {
        (document.querySelector('.gesture-demo') as HTMLElement).style.display = 'none';
    };
    document.addEventListener('touchstart', f, { capture: true, once: true });
    document.addEventListener('wheel', f, { capture: true, once: true });
    document.addEventListener('mousedown', f, { capture: true, once: true });
    document.addEventListener('keydown', f, { capture: true, once: true });
    return { enabled: false };
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(1e3),
    animation: initAnimation(),
    touch: { dragAction: 'hover' },
    zoom: {
        enabled: true,
        enableAxisDragging: false,
    },
    initialState: {
        zoom: {
            ratioX: { start: 0.48, end: 0.52 },
            ratioY: { start: 0.15, end: 0.6 },
        },
    },
    series: [
        {
            type: 'candlestick',
            xKey: 'timestamp',
            lowKey: 'low',
            highKey: 'high',
            openKey: 'open',
            closeKey: 'close',
        },
    ],
};

const chart = AgCharts.create(options);

function changeAction(newAction: NonNullable<AgTouchOptions['dragAction']>) {
    if (options.touch) {
        options.touch.dragAction = newAction;
    }
    chart.update(options);
}
