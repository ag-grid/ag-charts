import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';
import { type } from 'os';

ModuleRegistry.registerModules([
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
]);

const SMILEY_SVG='data:image/svg+xml;charset=utf-8;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQogIDxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iODAiIGZpbGw9InllbGxvdyIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIzIi8+DQogIDxjaXJjbGUgY3g9IjcwIiBjeT0iODAiIHI9IjgiIGZpbGw9ImJsYWNrIi8+DQogIDxjaXJjbGUgY3g9IjEzMCIgY3k9IjgwIiByPSI4IiBmaWxsPSJibGFjayIvPg0KICA8cGF0aCBkPSJNIDYwIDEyMCBRIDEwMCAxNjAgMTQwIDEyMCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+DQo8L3N2Zz4NCg=='

const TIMESTAMP_UTC_1970_01_02 = 86400000;

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: [
            { type: 'image', url: SMILEY_SVG, width: 55, height: 55, alt: 'smiley' },
            { type: 'text', text: 'MyTitle', verticalAlign:'middle' },
            { type: 'text', text: 'MyStrong', verticalAlign:'middle', fontWeight: 'bold' },
        ],
    },
    subtitle: {
        text: new Date(TIMESTAMP_UTC_1970_01_02),
    },
    footnote: {
        text: 'MyPlaintextFootnote',
    },
    contextMenu: {
        items: [
            'defaults',
            'separator',
            {
                showOn: 'caption',
                label: 'Run caption action',
                action: (ev) => {
                    // TODO(Claude) record callback
                },
            },
        ],
    },
};

AgCharts.create(options);

// TODO(Claude) add agE2E with `popActions()`. Follow established patterns of how agE2E initialised by example and how it's read/used by playwright .spec.ts files.
