import type { AgBoxPlotSeriesStyle } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { BoxPlotNodeDatum } from './boxPlotTypes';

const { Group, Rect, Line, BBox, Selection } = _Scene;
const { Logger } = _Util;

enum GroupTags {
    Box,
    Median,
    Outline,
    Whisker,
    Cap,
}

export class BoxPlotGroup extends Group implements _ModuleSupport.DistantObject {
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
        activeStyles: _ModuleSupport.DeepRequired<AgBoxPlotSeriesStyle>,
        isVertical: boolean,
        isReversedValueAxis: boolean | undefined
    ) {
        const {
            bandwidth,
            scaledValues: { xValue: axisValue, medianValue },
        } = datum;
        let { minValue, q1Value, q3Value, maxValue } = datum.scaledValues;

        if ((isVertical && !isReversedValueAxis) || (!isVertical && isReversedValueAxis)) {
            [maxValue, q3Value, q1Value, minValue] = [minValue, q1Value, q3Value, maxValue];
        }

        const position = (x: number, y: number, width: number, height: number) =>
            isVertical ? { y: x, x: y, width: height, height: width } : { x, y, width, height };
        const hPosition = (x1: number, x2: number, y: number) =>
            isVertical ? { y1: x1, y2: x2, x: y } : { x1, x2, y };
        const vPosition = (x: number, y1: number, y2: number) =>
            isVertical ? { x1: y1, x2: y2, y: x } : { x, y1, y2 };
        const bbox = (x: number, y: number, width: number, height: number) => {
            ({ x, y, width, height } = position(x, y, width, height));
            return new BBox(x, y, width, height);
        };

        const {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            cornerRadius,
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

        const boxesPosition = position(q1Value, axisValue, q3Value - q1Value, bandwidth);

        outline.setProperties(boxesPosition);

        boxes[0].setProperties(boxesPosition);
        boxes[0].setProperties({
            cornerRadius,
            clipBBox: bbox(q1Value, axisValue, Math.round(medianValue - q1Value + strokeWidth / 2), bandwidth),
        });

        boxes[1].setProperties(boxesPosition);
        boxes[1].setProperties({
            cornerRadius,
            clipBBox: bbox(
                Math.round(medianValue - strokeWidth / 2),
                axisValue,
                Math.floor(q3Value - medianValue + strokeWidth / 2),
                bandwidth
            ),
        });

        const medianStart = Math.max(Math.round(medianValue - strokeWidth / 2), q1Value + strokeWidth);
        const medianEnd = Math.min(Math.round(medianValue + strokeWidth / 2), q3Value - strokeWidth);

        median.setProperties(boxesPosition);
        median.setProperties({
            visible: medianStart < medianEnd,
            cornerRadius,
            clipBBox: bbox(
                medianStart,
                axisValue + strokeWidth,
                medianEnd - medianStart,
                Math.max(0, bandwidth - strokeWidth * 2)
            ),
        });

        const capStart = Math.floor(axisValue + (bandwidth * (1 - cap.lengthRatio)) / 2);
        const capEnd = Math.ceil(axisValue + (bandwidth * (1 + cap.lengthRatio)) / 2);

        caps[0].setProperties(vPosition(minValue, capStart, capEnd));
        caps[1].setProperties(vPosition(maxValue, capStart, capEnd));

        whiskers[0].setProperties(
            hPosition(
                Math.round(minValue + whiskerStyles.strokeWidth / 2),
                q1Value,
                Math.floor(axisValue + bandwidth / 2)
            )
        );

        whiskers[1].setProperties(
            hPosition(
                q3Value,
                Math.round(maxValue - whiskerStyles.strokeWidth / 2),
                Math.floor(axisValue + bandwidth / 2)
            )
        );

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

    distanceSquared(x: number, y: number): number {
        const nodes = Selection.selectByClass<_Scene.Rect | _Scene.Line>(this, Rect, Line);
        return _ModuleSupport.nearestSquared(x, y, nodes).distanceSquared;
    }

    get midPoint(): { x: number; y: number } {
        const datum: { midPoint?: { readonly x: number; readonly y: number } } = this.datum;
        if (datum.midPoint === undefined) {
            Logger.error('BoxPlotGroup.datum.midPoint is undefined');
            return { x: NaN, y: NaN };
        }
        return datum.midPoint;
    }
}
