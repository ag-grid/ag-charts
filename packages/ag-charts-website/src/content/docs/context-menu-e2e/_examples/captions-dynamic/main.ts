// @ag-skip-fws
import {
    AgCaptionContextMenuActionEvent,
    AgCartesianChartOptions,
    AgCharts,
    AgContextMenuGetItemsParams,
    AgContextMenuItem,
    ContextMenuModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([ContextMenuModule]);

const SMILEY_SVG =
    'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQogIDxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iODAiIGZpbGw9InllbGxvdyIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIzIi8+DQogIDxjaXJjbGUgY3g9IjcwIiBjeT0iODAiIHI9IjgiIGZpbGw9ImJsYWNrIi8+DQogIDxjaXJjbGUgY3g9IjEzMCIgY3k9IjgwIiByPSI4IiBmaWxsPSJibGFjayIvPg0KICA8cGF0aCBkPSJNIDYwIDEyMCBRIDEwMCAxNjAgMTQwIDEyMCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+DQo8L3N2Zz4NCg==';

const TIMESTAMP_UTC_1970_01_02 = 86400000;

// For e2e testing: every caption action pushes a serialisable record here, drained by `popActions()`.
type ActionRecord = { type: string; captionType: string };
const actions: ActionRecord[] = [];

// For e2e testing: every `getItems()` invocation pushes a serialisable record here, drained by `popGetItems()`.
type GetItemsRecord = { showOn: string; captionType?: string };
const getItemsCalls: GetItemsRecord[] = [];

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: [
            { type: 'image', url: SMILEY_SVG, width: 55, height: 55, alt: 'smiley' },
            { type: 'text', text: 'MyTitle', verticalAlign: 'middle' },
            { type: 'text', text: 'MyStrong', verticalAlign: 'middle', fontWeight: 'bold' },
        ],
    },
    subtitle: {
        text: new Date(TIMESTAMP_UTC_1970_01_02),
    },
    footnote: {
        text: 'MyPlaintextFootnote',
    },
    contextMenu: {
        getItems: (params: AgContextMenuGetItemsParams): AgContextMenuItem[] => {
            getItemsCalls.push({
                showOn: params.showOn,
                captionType: params.showOn === 'caption' ? params.captionType : undefined,
            });
            return [
                'defaults',
                'separator',
                {
                    showOn: 'caption',
                    label: 'Run caption action',
                    action: (ev: AgCaptionContextMenuActionEvent) => {
                        actions.push({ type: ev.type, captionType: ev.captionType });
                    },
                },
            ];
        },
    },
};

AgCharts.create(options);

// For e2e testing: expose drain-and-reset accessors for the recorded caption actions and `getItems()` calls.
(window as any).agE2E = {
    popActions: () => actions.splice(0),
    popGetItems: () => getItemsCalls.splice(0),
};
