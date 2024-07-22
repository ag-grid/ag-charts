import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { Annotations } from './annotations';

export const AnnotationsModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'annotations',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    dependencies: ['toolbar'],
    moduleFactory: (ctx) => new Annotations(ctx),
    themeTemplate: {
        annotations: {
            // Lines
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
                    fontFamily: _Theme.DEFAULT_FONT_FAMILY,
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
                    fontFamily: _Theme.DEFAULT_FONT_FAMILY,
                },
            },

            // Channels
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

            // Texts
            callout: {
                color: 'black',
                fontSize: 14,
                fontFamily: _Theme.DEFAULT_FONT_FAMILY,
                textAlign: 'center',
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                    stroke: _Theme.DEFAULT_ANNOTATION_STROKE,
                    strokeWidth: 2,
                    strokeOpacity: 1,
                },
            },
            comment: {
                color: 'white',
                fontSize: 14,
                fontFamily: _Theme.DEFAULT_FONT_FAMILY,
                textAlign: 'left',
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                    stroke: _Theme.DEFAULT_ANNOTATION_STROKE,
                    strokeWidth: 2,
                    strokeOpacity: 1,
                },
                fill: _Theme.PALETTE_NEUTRAL_FILL,
                stroke: _Theme.PALETTE_NEUTRAL_STROKE,
            },
            note: {
                color: 'black',
                fontSize: 14,
                fontFamily: _Theme.DEFAULT_FONT_FAMILY,
                textAlign: 'left',
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                    stroke: _Theme.DEFAULT_ANNOTATION_STROKE,
                    strokeWidth: 2,
                    strokeOpacity: 1,
                },
            },
            text: {
                color: 'black',
                fontSize: 14,
                fontFamily: _Theme.DEFAULT_FONT_FAMILY,
                textAlign: 'left',
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                    stroke: _Theme.DEFAULT_ANNOTATION_STROKE,
                    strokeWidth: 2,
                    strokeOpacity: 1,
                },
            },
        },
    },
};
