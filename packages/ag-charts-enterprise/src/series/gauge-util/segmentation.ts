import { _ModuleSupport, type _Scale, _Util } from 'ag-charts-community';

const { BaseProperties, Validate, OBJECT, NUMBER, NUMBER_ARRAY } = _ModuleSupport;
const { Logger } = _Util;

export class GaugeSegmentationIntervalProperties extends BaseProperties {
    @Validate(NUMBER_ARRAY, { optional: true })
    values?: number[] | undefined;

    @Validate(NUMBER, { optional: true })
    step?: number;

    @Validate(NUMBER, { optional: true })
    count?: number;
}

export class GaugeSegmentationProperties extends BaseProperties {
    @Validate(OBJECT)
    readonly interval = new GaugeSegmentationIntervalProperties();

    @Validate(NUMBER, { optional: true })
    spacing: number | undefined;

    getSegments(scale: _Scale.Scale<number, number>, maxTicks: number) {
        const { spacing } = this;
        const { values, step, count } = this.interval;
        const d0 = Math.min(...scale.domain);
        const d1 = Math.max(...scale.domain);

        let ticks: number[] | undefined;
        if (values != null) {
            const segments = values.filter((v) => v > d0 && v < d1).sort((a, b) => a - b);
            ticks = [d0, ...segments, d1];
        } else if (step != null) {
            const segments: number[] = [];
            for (let i = d0; i < d1; i += step) {
                segments.push(i);
            }
            segments.push(d1);
            ticks = segments;
        } else if (count != null) {
            const segments = count + 1;
            ticks = Array.from({ length: segments + 1 }, (_, i) => (i / segments) * (d1 - d0) + d0);
        } else if (spacing != null) {
            ticks = scale.ticks?.();
        }

        if (ticks != null && ticks.length > maxTicks) {
            Logger.warnOnce(
                `the configured segmentation results in more than 1 item per pixel, ignoring. Supply a segmentation configuration that results in larger segments or omit this configuration`
            );
            return;
        }

        return ticks;
    }
}
