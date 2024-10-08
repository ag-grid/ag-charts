import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { type PositionedScene, layoutScenesColumn, layoutScenesRow } from '../utils/layout';
import type { MeasurerTypeProperties } from './measurerProperties';

export interface Statistics {
    dateRange?: { bars: number; value: number };
    priceRange?: { percentage: number; value: number };
    volume: number;
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
        datum: MeasurerTypeProperties,
        stats: Statistics,
        anchor: _ModuleSupport.Vec2,
        localeManager?: _ModuleSupport.ModuleContext['localeManager']
    ) {
        const {
            background,
            dateRangeBarsText,
            dateRangeDivider,
            dateRangeValueText,
            priceRangeValueText,
            priceRangeDivider,
            priceRangePercentageText,
            volumeText,
        } = this;

        const padding = 10;
        const horizontalGap = 8;
        const verticalGap = 12;

        const textStyles = {
            fontFamily: datum.statistics.fontFamily,
            fontSize: datum.statistics.fontSize,
            fontStyle: datum.statistics.fontStyle,
            fontWeight: datum.statistics.fontWeight,
            textBaseline: 'top' as const,
        };

        const dividerLineStyles = {
            stroke: datum.statistics.divider.stroke,
            strokeOpacity: datum.statistics.divider.strokeOpacity,
            strokeWidth: datum.statistics.divider.strokeWidth,
        };

        const dateScenes = [dateRangeBarsText, dateRangeDivider, dateRangeValueText];
        const priceScenes = [priceRangeValueText, priceRangeDivider, priceRangePercentageText];
        const scenes: Array<PositionedScene | Array<PositionedScene>> = [];

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

        volumeText.setProperties({
            ...textStyles,
            x: anchor.x,
            text: this.formatVolume(stats.volume, localeManager),
        });
        scenes.push(volumeText);

        layoutScenesColumn(scenes, anchor.y, verticalGap);

        const bbox = _Scene.Group.computeChildrenBBox(scenes.flat());
        bbox.grow(padding);

        background.setProperties({
            ...bbox,
            x: bbox.x - bbox.width / 2 + padding,
            y: bbox.y + padding,
            fill: datum.statistics.fill,
            stroke: datum.statistics.stroke,
            strokeOpacity: datum.statistics.strokeOpacity,
            strokeWidth: datum.statistics.strokeWidth,
            cornerRadius: 4,
        });

        // Reposition center and below the anchor
        for (const scene of scenes) {
            if (Array.isArray(scene)) {
                const rowWidth = _Scene.Group.computeChildrenBBox(scene).width;
                for (const scene_ of scene) {
                    scene_.x -= rowWidth / 2;
                    scene_.y += padding;
                }
            } else {
                scene.x -= scene.getBBox().width / 2;
                scene.y += padding;
            }
        }
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
