import type { BoxPlotNodeDatum } from 'ag-charts-community';
import { _Scene } from 'ag-charts-community';

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
            xValue: axisValue,
            whisker: whiskerProperties,
            minValue,
            q1Value,
            medianValue,
            q3Value,
            maxValue,
            bandwidth,
            cap,
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

        const capY1 = axisValue + (bandwidth * (1 - cap.lengthRatio)) / 2;
        const capY2 = axisValue + (bandwidth * (1 + cap.lengthRatio)) / 2;

        caps[0].setProperties({ x: minValue, y1: capY1, y2: capY2 });
        caps[1].setProperties({ x: maxValue, y1: capY1, y2: capY2 });

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
