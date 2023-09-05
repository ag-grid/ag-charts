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
        super({ layer: true });
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
            bandwidth,
            minValue,
            q1Value,
            medianValue,
            q3Value,
            maxValue,
            yValue,
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

        outline.setStyles({ x: q1Value, y: yValue, width: q3Value - q1Value, height: bandwidth });

        boxes[0].setStyles({
            x: q1Value,
            y: yValue,
            width: Math.round(medianValue - q1Value + strokeWidth / 2),
            height: bandwidth,
        });

        boxes[1].setStyles({
            x: Math.round(medianValue - strokeWidth / 2),
            y: yValue,
            width: Math.floor(q3Value - medianValue + strokeWidth / 2),
            height: bandwidth,
        });

        median.setStyles({
            x: medianValue,
            y1: yValue + strokeWidth,
            y2: yValue + bandwidth - strokeWidth,
        });

        const capSize = 0.5;
        const capY1 = yValue + bandwidth * capSize * 0.5;
        const capY2 = yValue + bandwidth * capSize * 1.5;

        caps[0].setStyles({ x: minValue, y1: capY1, y2: capY2 });
        caps[1].setStyles({ x: maxValue, y1: capY1, y2: capY2 });

        whiskers[0].setStyles({
            x1: Math.round(minValue + strokeWidth / 2),
            x2: q1Value,
            y: yValue + bandwidth * 0.5,
        });

        whiskers[1].setStyles({
            x1: q3Value,
            x2: Math.round(maxValue - strokeWidth / 2),
            y: yValue + bandwidth * 0.5,
        });

        // fill only elements
        for (const element of boxes) {
            element.fill = fill;
            element.fillOpacity = fillOpacity;
            element.strokeWidth = strokeWidth * 2;
            element.strokeOpacity = 0;
        }

        // stroke only elements
        for (const element of [outline, median, ...whiskers, ...caps]) {
            element.fillOpacity = 0;
            element.stroke = stroke;
            element.strokeWidth = strokeWidth;
            element.strokeOpacity = strokeOpacity;
            element.lineDash = lineDash;
            element.lineDashOffset = lineDashOffset;
        }
    }
}
