import { _ModuleSupport, _Scene } from 'ag-charts-community';

import type { AnnotationContext } from '../annotationTypes';
import { type PositionedScene, layoutAddX, layoutAddY, layoutScenesColumn, layoutScenesRow } from '../utils/layout';
import type { MeasurerStatistics } from './measurerProperties';

export interface Statistics {
    dateRange?: { bars: number; value: number };
    priceRange?: { percentage: number; value: number };
    volume?: number;
}

export class MeasurerStatisticsScene extends _Scene.Group {
    override name = 'MeasurerStatisticsScene';

    private readonly background = new _Scene.Rect();
    private readonly dateRangeBarsText = new _Scene.Text();
    private readonly dateRangeDivider = new _Scene.Line();
    private readonly dateRangeValueText = new _Scene.Text();
    private readonly priceRangeValueText = new _Scene.Text();
    private readonly priceRangeDivider = new _Scene.Line();
    private readonly priceRangePercentageText = new _Scene.Text();
    private readonly volumeText = new _Scene.Text();

    private readonly volumeFormatter = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    constructor() {
        super();
        this.append([
            this.background,
            this.dateRangeBarsText,
            this.dateRangeDivider,
            this.dateRangeValueText,
            this.priceRangeValueText,
            this.priceRangeDivider,
            this.priceRangePercentageText,
            this.volumeText,
        ]);
    }

    update(
        datum: MeasurerStatistics,
        stats: Statistics,
        anchor: _ModuleSupport.Vec2,
        context: AnnotationContext,
        localeManager?: _ModuleSupport.ModuleContext['localeManager']
    ) {
        const scenes = this.updateStatistics(datum, stats, anchor, localeManager);

        const bbox = _Scene.Group.computeChildrenBBox(scenes.flat());
        const padding = 10;
        bbox.grow(padding);

        this.updateBackground(datum, bbox, padding);
        this.reposition(scenes, padding, context);
    }

    private updateStatistics(
        datum: MeasurerStatistics,
        stats: Statistics,
        anchor: _ModuleSupport.Vec2,
        localeManager?: _ModuleSupport.ModuleContext['localeManager']
    ) {
        const {
            dateRangeBarsText,
            dateRangeDivider,
            dateRangeValueText,
            priceRangeValueText,
            priceRangeDivider,
            priceRangePercentageText,
            volumeText,
        } = this;

        const horizontalGap = 8;
        const verticalGap = 6;
        const dividerLineHeight = datum.fontSize + 3;
        const dividerLineOffset = -2;

        const textStyles = {
            fontFamily: datum.fontFamily,
            fontSize: datum.fontSize,
            fontStyle: datum.fontStyle,
            fontWeight: datum.fontWeight,
            textBaseline: 'top' as const,
        };

        const dividerLineStyles = {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: dividerLineHeight,
            stroke: datum.divider.stroke,
            strokeOpacity: datum.divider.strokeOpacity,
            strokeWidth: datum.divider.strokeWidth,
        };

        const dateScenes = [dateRangeBarsText, dateRangeDivider, dateRangeValueText];
        const priceScenes = [priceRangeValueText, priceRangeDivider, priceRangePercentageText];
        const scenes: Array<PositionedScene | Array<PositionedScene>> = [];

        if (stats.priceRange) {
            priceRangeValueText.setProperties({
                ...textStyles,
                text: this.formatPriceRangeValue(stats.priceRange.value, localeManager),
            });
            priceRangeDivider.setProperties(dividerLineStyles);
            priceRangePercentageText.setProperties({
                ...textStyles,
                text: this.formatPriceRangePercentage(stats.priceRange.percentage, localeManager),
            });

            layoutScenesRow(priceScenes, anchor.x, horizontalGap);
            scenes.push(priceScenes);
        }

        if (stats.dateRange) {
            dateRangeBarsText.setProperties({
                ...textStyles,
                text: this.formatDateRangeBars(stats.dateRange.bars, localeManager),
            });
            dateRangeDivider.setProperties(dividerLineStyles);
            dateRangeValueText.setProperties({
                ...textStyles,
                text: this.formatDateRangeValue(stats.dateRange.value),
            });

            layoutScenesRow(dateScenes, anchor.x, horizontalGap);
            scenes.push(dateScenes);
        }

        if (stats.volume != null) {
            volumeText.setProperties({
                ...textStyles,
                x: anchor.x,
                text: this.formatVolume(stats.volume, localeManager),
            });
            scenes.push(volumeText);
        }

        layoutScenesColumn(scenes, anchor.y, verticalGap);

        priceRangeDivider.y1 += dividerLineOffset;
        priceRangeDivider.y2 += dividerLineOffset;
        dateRangeDivider.y1 += dividerLineOffset;
        dateRangeDivider.y2 += dividerLineOffset;

        return scenes;
    }

    private updateBackground(datum: MeasurerStatistics, bbox: _Scene.BBox, padding: number) {
        this.background.setProperties({
            ...bbox,
            x: bbox.x - bbox.width / 2 + padding,
            y: bbox.y,
            fill: datum.fill,
            stroke: datum.stroke,
            strokeOpacity: datum.strokeOpacity,
            strokeWidth: datum.strokeWidth,
            cornerRadius: 4,
        });
    }

    private reposition(
        scenes: Array<PositionedScene | Array<PositionedScene>>,
        padding: number,
        context: AnnotationContext
    ) {
        const rectY = context.seriesRect.y + context.seriesRect.height;
        const bbox = this.background.getBBox();
        const backgroundY = bbox.y + bbox.height;
        const offsetY = Math.min(padding, rectY - backgroundY);

        // Reposition center and below the anchor
        for (const scene of scenes) {
            if (Array.isArray(scene)) {
                const rowWidth = _Scene.Group.computeChildrenBBox(scene).width;
                for (const scene_ of scene) {
                    layoutAddX(scene_, -rowWidth / 2);
                    layoutAddY(scene_, offsetY);
                }
            } else {
                layoutAddX(scene, -scene.getBBox().width / 2);
                layoutAddY(scene, offsetY);
            }
        }

        this.background.y += offsetY;
    }

    private formatDateRangeBars(bars: number, localeManager?: _ModuleSupport.ModuleContext['localeManager']) {
        return localeManager?.t('measurerDateRangeBars', { value: bars }) ?? `${bars}`;
    }

    private formatDateRangeValue(time: number) {
        const range = [];

        const MINUTE = 1000 * 60;
        const HOUR = MINUTE * 60;
        const DAY = HOUR * 24;

        const minutes = Math.floor(time / MINUTE);
        const hours = Math.floor(time / HOUR);
        const days = Math.floor(time / DAY);

        const remainderHours = hours % (DAY / HOUR);
        const remainderMinutes = minutes % (HOUR / MINUTE);

        if (days >= 1) range.push(`${days}d`);
        if (hours >= 1 && (time < DAY || remainderHours !== 0)) range.push(`${remainderHours}h`);
        if (time < HOUR || remainderMinutes !== 0) range.push(`${remainderMinutes}m`);

        return range.join(' ');
    }

    private formatPriceRangeValue(value: number, localeManager?: _ModuleSupport.ModuleContext['localeManager']) {
        return localeManager?.t('measurerPriceRangeValue', { value: Number(value.toFixed(2)) }) ?? `${value}`;
    }

    private formatPriceRangePercentage(
        percentage: number,
        localeManager?: _ModuleSupport.ModuleContext['localeManager']
    ) {
        return localeManager?.t('measurerPriceRangePercent', { value: percentage }) ?? `${percentage}`;
    }

    private formatVolume(volume: number, localeManager?: _ModuleSupport.ModuleContext['localeManager']) {
        const volumeString = this.volumeFormatter.format(volume);
        return localeManager?.t('measurerVolume', { value: volumeString }) ?? volumeString;
    }
}
