import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { Annotations } from './annotations';

export const AnnotationsModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'annotations',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    instanceConstructor: Annotations,
    themeTemplate: {
        annotations: {
            handle: {
                fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
            },
            line: {
                stroke: _Theme.DEFAULT_ANNOTATION_STROKE,
                strokeWidth: 2,
                strokeOpacity: 1,
            },
            'parallel-channel': {
                stroke: _Theme.DEFAULT_ANNOTATION_STROKE,
                strokeWidth: 2,
                strokeOpacity: 1,
                middle: {
                    lineDash: [6, 5],
                    strokeWidth: 1,
                },
                background: {
                    fill: _Theme.DEFAULT_ANNOTATION_BACKGROUND_FILL,
                    fillOpacity: 0.2,
                },
            },
        },
    },
};
