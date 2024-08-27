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
                stroke: _Theme.DEFAULT_ANNOTATION_COLOR,
                strokeWidth: 2,
                strokeOpacity: 1,
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                    strokeWidth: 2,
                },
                text: {
                    position: 'top',
                    alignment: 'center',
                    color: _Theme.DEFAULT_ANNOTATION_COLOR,
                    fontSize: 14,
                    fontFamily: _Theme.DEFAULT_FONT_FAMILY,
                },
            },
            'horizontal-line': {
                stroke: _Theme.DEFAULT_ANNOTATION_COLOR,
                strokeWidth: 2,
                strokeOpacity: 1,
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                    strokeWidth: 2,
                },
                axisLabel: {
                    enabled: true,
                    color: 'white',
                    fill: _Theme.DEFAULT_ANNOTATION_COLOR,
                    fontSize: 12,
                    fontFamily: _Theme.DEFAULT_FONT_FAMILY,
                },
                text: {
                    position: 'top',
                    alignment: 'center',
                    color: _Theme.DEFAULT_ANNOTATION_COLOR,
                    fontSize: 14,
                    fontFamily: _Theme.DEFAULT_FONT_FAMILY,
                },
            },
            'vertical-line': {
                stroke: _Theme.DEFAULT_ANNOTATION_COLOR,
                strokeWidth: 2,
                strokeOpacity: 1,
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                    strokeWidth: 2,
                },
                axisLabel: {
                    enabled: true,
                    color: 'white',
                    fill: _Theme.DEFAULT_ANNOTATION_COLOR,
                    fontSize: 12,
                    fontFamily: _Theme.DEFAULT_FONT_FAMILY,
                },
                text: {
                    position: 'top',
                    alignment: 'center',
                    color: _Theme.DEFAULT_ANNOTATION_COLOR,
                    fontSize: 14,
                    fontFamily: _Theme.DEFAULT_FONT_FAMILY,
                },
            },

            // Channels
            'disjoint-channel': {
                stroke: _Theme.DEFAULT_ANNOTATION_COLOR,
                strokeWidth: 2,
                strokeOpacity: 1,
                background: {
                    fill: _Theme.DEFAULT_ANNOTATION_BACKGROUND_FILL,
                    fillOpacity: 0.2,
                },
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                    strokeWidth: 2,
                },
                text: {
                    position: 'top',
                    alignment: 'center',
                    color: _Theme.DEFAULT_ANNOTATION_COLOR,
                    fontSize: 14,
                    fontFamily: _Theme.DEFAULT_FONT_FAMILY,
                },
            },
            'parallel-channel': {
                stroke: _Theme.DEFAULT_ANNOTATION_COLOR,
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
                    strokeWidth: 2,
                },
                text: {
                    position: 'top',
                    alignment: 'center',
                    color: _Theme.DEFAULT_ANNOTATION_COLOR,
                    fontSize: 14,
                    fontFamily: _Theme.DEFAULT_FONT_FAMILY,
                },
            },

            // Texts
            callout: {
                color: _Theme.DEFAULT_LABEL_COLOUR,
                fontSize: 14,
                fontFamily: _Theme.DEFAULT_FONT_FAMILY,
                textAlign: 'left',
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                    strokeWidth: 2,
                    strokeOpacity: 1,
                },
                stroke: _Theme.DEFAULT_ANNOTATION_COLOR,
                strokeWidth: 2,
                fill: _Theme.DEFAULT_ANNOTATION_BACKGROUND_FILL,
                fillOpacity: 0.2,
            },
            comment: {
                color: 'white',
                fontSize: 14,
                fontFamily: _Theme.DEFAULT_FONT_FAMILY,
                fontWeight: 700,
                textAlign: 'left',
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                    strokeWidth: 2,
                    strokeOpacity: 1,
                },
                fill: _Theme.PALETTE_NEUTRAL_FILL,
            },
            note: {
                color: _Theme.DEFAULT_TEXTBOX_COLOR,
                fill: _Theme.DEFAULT_ANNOTATION_COLOR,
                stroke: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                strokeWidth: 1,
                strokeOpacity: 1,
                fontSize: 14,
                fontFamily: _Theme.DEFAULT_FONT_FAMILY,
                textAlign: 'left',
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                    strokeWidth: 2,
                    strokeOpacity: 1,
                },
                background: {
                    fill: _Theme.DEFAULT_TEXTBOX_FILL,
                    stroke: _Theme.DEFAULT_TEXTBOX_STROKE,
                    strokeWidth: 1,
                },
            },
            text: {
                color: _Theme.DEFAULT_TEXT_ANNOTATION_COLOR,
                fontSize: 14,
                fontFamily: _Theme.DEFAULT_FONT_FAMILY,
                textAlign: 'left',
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                    strokeWidth: 2,
                    strokeOpacity: 1,
                },
            },

            // Shapes
            arrow: {
                stroke: _Theme.DEFAULT_ANNOTATION_COLOR,
                strokeWidth: 2,
                strokeOpacity: 1,
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                },
            },
            'arrow-up': {
                fill: _Theme.PALETTE_UP_FILL,
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                    stroke: _Theme.DEFAULT_ANNOTATION_COLOR,
                    strokeWidth: 2,
                },
            },
            'arrow-down': {
                fill: _Theme.PALETTE_DOWN_FILL,
                handle: {
                    fill: _Theme.DEFAULT_ANNOTATION_HANDLE_FILL,
                    stroke: _Theme.DEFAULT_ANNOTATION_COLOR,
                    strokeWidth: 2,
                },
            },
        },
    },
};
