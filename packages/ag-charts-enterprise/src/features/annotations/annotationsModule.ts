import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { Annotations } from './annotations';

export const AnnotationsModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'annotations',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    dependencies: ['initialState', 'toolbar'],
    instanceConstructor: Annotations,
    themeTemplate: {
        annotations: {
            line: {
                stroke: _Theme.DEFAULT_ANNOTATION_STROKE,
                strokeWidth: 2,
                strokeOpacity: 1,
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                },
            },
            'horizontal-line': {
                stroke: _Theme.DEFAULT_ANNOTATION_STROKE,
                strokeWidth: 2,
                strokeOpacity: 1,
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                },
                axisLabel: {
                    enabled: true,
                    color: 'white',
                    fill: _Theme.DEFAULT_ANNOTATION_STROKE,
                    fontSize: 12,
                    padding: 8,
                },
            },
            'vertical-line': {
                stroke: _Theme.DEFAULT_ANNOTATION_STROKE,
                strokeWidth: 2,
                strokeOpacity: 1,
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                },
                axisLabel: {
                    enabled: true,
                    color: 'white',
                    fill: _Theme.DEFAULT_ANNOTATION_STROKE,
                    fontSize: 12,
                    padding: 8,
                },
            },
            'disjoint-channel': {
                stroke: _Theme.DEFAULT_ANNOTATION_STROKE,
                strokeWidth: 2,
                strokeOpacity: 1,
                background: {
                    fill: _Theme.DEFAULT_ANNOTATION_BACKGROUND_FILL,
                    fillOpacity: 0.2,
                },
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                },
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
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                },
            },
        },
    },
};
