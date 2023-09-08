import type { AgBoxPlotSeriesFormat, AgBoxPlotWhiskerOptions } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { BoxPlotNodeDatum } from './boxPlotTypes';

enum GroupTags {
    Box,
    Median,
    Outline,
    Whisker,
    Cap,
}

const seriesFormatKeys: (keyof AgBoxPlotSeriesFormat)[] = [
    'fill',
    'fillOpacity',
    'stroke',
    'strokeWidth',
    'strokeOpacity',
];

const whiskerFormatKeys: (keyof AgBoxPlotWhiskerOptions)[] = [
    'stroke',
    'strokeWidth',
    'strokeOpacity',
    'lineDash',
    'lineDashOffset',
];

export class BoxPlotGroup extends _Scene.Group {
    constructor() {
        super();
        this.append([
            new _Scene.Rect({ tag: GroupTags.Box }),
            new _Scene.Rect({ tag: GroupTags.Box }),
            new _Scene.Rect({ tag: GroupTags.Outline }),
            new _Scene.Line({ tag: GroupTags.Median }),
            new _Scene.Line({ tag: GroupTags.Whisker }),
            new _Scene.Line({ tag: GroupTags.Whisker }),
            new _Scene.Line({ tag: GroupTags.Cap }),
            new _Scene.Line({ tag: GroupTags.Cap }),
        ]);
    }

    updateDatumStyles(datum: BoxPlotNodeDatum, formatOverrides: AgBoxPlotSeriesFormat = {}, invertAxes = false) {
        const {
            xValue: axisValue,
            whisker: whiskerOptions,
            minValue,
            q1Value,
            medianValue,
            q3Value,
            maxValue,
            bandwidth,
            cap,
            lineDash,
            lineDashOffset,
        } = datum;

        const selection = _Scene.Selection.select(this, _Scene.Rect);
        const boxes = selection.selectByTag<_Scene.Rect>(GroupTags.Box);
        const [outline] = selection.selectByTag<_Scene.Rect>(GroupTags.Outline);
        const [median] = selection.selectByTag<_Scene.Line>(GroupTags.Median);
        const whiskers = selection.selectByTag<_Scene.Line>(GroupTags.Whisker);
        const caps = selection.selectByTag<_Scene.Line>(GroupTags.Cap);

        const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity } = _ModuleSupport.defaultsByKeys(
            seriesFormatKeys,
            formatOverrides,
            datum
        );

        const whiskerProperties = _ModuleSupport.defaultsByKeys(whiskerFormatKeys, whiskerOptions, {
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        });

        const capStart = axisValue + (bandwidth * (1 - cap.lengthRatio)) / 2;
        const capEnd = axisValue + (bandwidth * (1 + cap.lengthRatio)) / 2;

        if (invertAxes) {
            outline.setProperties({ x: axisValue, y: q3Value, width: bandwidth, height: q1Value - q3Value });

            boxes[0].setProperties({
                x: axisValue,
                y: q3Value,
                width: bandwidth,
                height: Math.round(medianValue - q3Value + strokeWidth / 2),
            });

            boxes[1].setProperties({
                x: axisValue,
                y: Math.round(medianValue - strokeWidth / 2),
                width: bandwidth,
                height: Math.floor(q1Value - medianValue + strokeWidth / 2),
            });

            median.setProperties({
                x1: axisValue + strokeWidth,
                x2: axisValue + bandwidth - strokeWidth,
                y: medianValue,
            });

            caps[0].setProperties({ x1: capStart, x2: capEnd, y: minValue });
            caps[1].setProperties({ x1: capStart, x2: capEnd, y: maxValue });

            whiskers[0].setProperties({
                x: axisValue + bandwidth / 2,
                y1: Math.round(minValue + whiskerProperties.strokeWidth / 2),
                y2: q1Value,
            });

            whiskers[1].setProperties({
                x: axisValue + bandwidth / 2,
                y1: q3Value,
                y2: Math.round(maxValue - whiskerProperties.strokeWidth / 2),
            });
        } else {
            outline.setProperties({ x: q1Value, y: axisValue, width: q3Value - q1Value, height: bandwidth });

            boxes[0].setProperties({
                x: q1Value,
                y: axisValue,
                width: Math.round(medianValue - q1Value + strokeWidth / 2),
                height: bandwidth,
            });

            boxes[1].setProperties({
                x: Math.round(medianValue - strokeWidth / 2),
                y: axisValue,
                width: Math.floor(q3Value - medianValue + strokeWidth / 2),
                height: bandwidth,
            });

            median.setProperties({
                x: medianValue,
                y1: axisValue + strokeWidth,
                y2: axisValue + bandwidth - strokeWidth,
            });

            caps[0].setProperties({ x: minValue, y1: capStart, y2: capEnd });
            caps[1].setProperties({ x: maxValue, y1: capStart, y2: capEnd });

            whiskers[0].setProperties({
                x1: Math.round(minValue + whiskerProperties.strokeWidth / 2),
                x2: q1Value,
                y: axisValue + bandwidth / 2,
            });

            whiskers[1].setProperties({
                x1: q3Value,
                x2: Math.round(maxValue - whiskerProperties.strokeWidth / 2),
                y: axisValue + bandwidth / 2,
            });
        }

        // fill only elements
        for (const element of boxes) {
            element.setProperties({ fill, fillOpacity, strokeWidth: strokeWidth * 2, strokeOpacity: 0 });
        }

        // stroke only elements
        for (const element of [outline, median]) {
            element.setProperties({ stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, fillOpacity: 0 });
        }

        for (const element of [...whiskers, ...caps]) {
            element.setProperties(whiskerProperties);
        }
    }
}
