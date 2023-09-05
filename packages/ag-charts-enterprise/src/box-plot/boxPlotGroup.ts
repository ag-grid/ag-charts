import { _Scene } from 'ag-charts-community';
import type { BoxPlotNodeDatum } from './boxPlotTypes';

enum GroupTags {
    Box,
    Median,
    Outline,
    Whisker,
    Cap,
}

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

    updateDatumStyles(datum: BoxPlotNodeDatum) {
        const {
            yValue,
            minValue,
            q1Value,
            medianValue,
            q3Value,
            maxValue,
            bandwidth,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        } = datum;

        const selection = _Scene.Selection.select(this, _Scene.Rect);
        const boxes = selection.selectByTag<_Scene.Rect>(GroupTags.Box);
        const [outline] = selection.selectByTag<_Scene.Rect>(GroupTags.Outline);
        const [median] = selection.selectByTag<_Scene.Line>(GroupTags.Median);
        const whiskers = selection.selectByTag<_Scene.Line>(GroupTags.Whisker);
        const caps = selection.selectByTag<_Scene.Line>(GroupTags.Cap);

        outline.setProperties({ x: q1Value, y: yValue, width: q3Value - q1Value, height: bandwidth });

        boxes[0].setProperties({
            x: q1Value,
            y: yValue,
            width: Math.round(medianValue - q1Value + strokeWidth / 2),
            height: bandwidth,
        });

        boxes[1].setProperties({
            x: Math.round(medianValue - strokeWidth / 2),
            y: yValue,
            width: Math.floor(q3Value - medianValue + strokeWidth / 2),
            height: bandwidth,
        });

        median.setProperties({
            x: medianValue,
            y1: yValue + strokeWidth,
            y2: yValue + bandwidth - strokeWidth,
        });

        const capLengthRatio = 0.5; // TODO extract value from user input
        const capY1 = yValue + (bandwidth * (1 - capLengthRatio)) / 2;
        const capY2 = yValue + (bandwidth * (1 + capLengthRatio)) / 2;

        caps[0].setProperties({ x: minValue, y1: capY1, y2: capY2 });
        caps[1].setProperties({ x: maxValue, y1: capY1, y2: capY2 });

        whiskers[0].setProperties({
            x1: Math.round(minValue + strokeWidth / 2),
            x2: q1Value,
            y: yValue + bandwidth * 0.5,
        });

        whiskers[1].setProperties({
            x1: q3Value,
            x2: Math.round(maxValue - strokeWidth / 2),
            y: yValue + bandwidth * 0.5,
        });

        // fill only elements
        for (const element of boxes) {
            element.setProperties({ fill, fillOpacity, strokeWidth: strokeWidth * 2, strokeOpacity: 0 });
        }

        // stroke only elements
        for (const element of [outline, median, ...whiskers, ...caps]) {
            element.setProperties({ stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, fillOpacity: 0 });
        }
    }
}
