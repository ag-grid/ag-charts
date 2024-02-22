import type { AgBoxPlotSeriesStyles } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';

import type { BoxPlotNodeDatum } from './boxPlotTypes';

const { Group, Rect, Line, BBox, Selection } = _Scene;

enum GroupTags {
    Box,
    Median,
    Outline,
    Whisker,
    Cap,
}

export class BoxPlotGroup extends Group {
    constructor() {
        super();
        this.append([
            new Rect({ tag: GroupTags.Box }),
            new Rect({ tag: GroupTags.Box }),
            new Rect({ tag: GroupTags.Outline }),
            new Rect({ tag: GroupTags.Median }),
            new Line({ tag: GroupTags.Whisker }),
            new Line({ tag: GroupTags.Whisker }),
            new Line({ tag: GroupTags.Cap }),
            new Line({ tag: GroupTags.Cap }),
        ]);
    }

    updateDatumStyles(
        datum: BoxPlotNodeDatum,
        activeStyles: _ModuleSupport.DeepRequired<AgBoxPlotSeriesStyles>,
        isVertical: boolean,
        isReversedValueAxis?: boolean
    ) {
        const cornerRadius = 100;
        const {
            bandwidth,
            scaledValues: { xValue: axisValue, medianValue },
        } = datum;
        let { minValue, q1Value, q3Value, maxValue } = datum.scaledValues;

        if ((isVertical && !isReversedValueAxis) || (!isVertical && isReversedValueAxis)) {
            [maxValue, q3Value, q1Value, minValue] = [minValue, q1Value, q3Value, maxValue];
        }

        const {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            cap,
            whisker: whiskerStyles,
        } = activeStyles;

        const selection = Selection.select(this, Rect);
        const boxes = selection.selectByTag<_Scene.Rect>(GroupTags.Box);
        const [outline] = selection.selectByTag<_Scene.Rect>(GroupTags.Outline);
        const [median] = selection.selectByTag<_Scene.Rect>(GroupTags.Median);
        const whiskers = selection.selectByTag<_Scene.Line>(GroupTags.Whisker);
        const caps = selection.selectByTag<_Scene.Line>(GroupTags.Cap);

        if (whiskerStyles.strokeWidth > bandwidth) {
            whiskerStyles.strokeWidth = bandwidth;
        }

        outline.setProperties({ x: q1Value, y: axisValue, width: q3Value - q1Value, height: bandwidth });

        const cornerRadiusBbox = isVertical
            ? new BBox(axisValue, q1Value, bandwidth, q3Value - q1Value)
            : new BBox(q1Value, axisValue, q3Value - q1Value, bandwidth);

        boxes[0].setProperties({
            x: q1Value,
            y: axisValue,
            width: Math.round(medianValue - q1Value + strokeWidth / 2),
            height: bandwidth,
            cornerRadius,
            cornerRadiusBbox,
        });

        boxes[1].setProperties({
            x: Math.round(medianValue - strokeWidth / 2),
            y: axisValue,
            width: Math.floor(q3Value - medianValue + strokeWidth / 2),
            height: bandwidth,
            cornerRadius,
            cornerRadiusBbox,
        });

        const medianStart = Math.max(Math.round(medianValue - strokeWidth / 2), q1Value + strokeWidth);
        const medianEnd = Math.min(Math.round(medianValue + strokeWidth / 2), q3Value - strokeWidth);

        median.setProperties({
            visible: medianStart < medianEnd,
            x: medianStart,
            y: axisValue + strokeWidth,
            width: medianEnd - medianStart,
            height: Math.max(0, bandwidth - strokeWidth * 2),
            cornerRadius,
            cornerRadiusBbox,
        });

        const capStart = Math.floor(axisValue + (bandwidth * (1 - cap.lengthRatio)) / 2);
        const capEnd = Math.ceil(axisValue + (bandwidth * (1 + cap.lengthRatio)) / 2);

        caps[0].setProperties({ x: minValue, y1: capStart, y2: capEnd });
        caps[1].setProperties({ x: maxValue, y1: capStart, y2: capEnd });

        whiskers[0].setProperties({
            x1: Math.round(minValue + whiskerStyles.strokeWidth / 2),
            x2: q1Value,
            y: Math.floor(axisValue + bandwidth / 2),
        });

        whiskers[1].setProperties({
            x1: q3Value,
            x2: Math.round(maxValue - whiskerStyles.strokeWidth / 2),
            y: Math.floor(axisValue + bandwidth / 2),
        });

        if (isVertical) {
            _ModuleSupport.invertShapeDirection(outline, median, ...boxes, ...caps, ...whiskers);
        }

        // fill only elements
        for (const element of boxes) {
            element.setProperties({ fill, fillOpacity, strokeWidth: strokeWidth * 2, strokeOpacity: 0 });
        }

        median.setProperties({ fill: stroke, fillOpacity: strokeOpacity, strokeWidth: 0 });

        // stroke only elements
        for (const element of [...whiskers, ...caps]) {
            element.setProperties(whiskerStyles);
        }

        outline.setProperties({
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            cornerRadius,
            fillOpacity: 0,
        });
    }
}
