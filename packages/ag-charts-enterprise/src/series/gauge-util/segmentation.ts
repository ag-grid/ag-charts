import { BaseProperties, Logger, Property, type Scale } from 'ag-charts-core';

class GaugeSegmentationIntervalProperties extends BaseProperties {
    @Property
    values?: Array<number | bigint>;

    @Property
    step?: number | bigint;

    @Property
    count?: number;

    getSegments(scale: Scale<number, number>, maxTicks: number) {
        const { values, step, count } = this;
        const d0 = Math.min(...scale.domain);
        const d1 = Math.max(...scale.domain);

        let ticks: Array<number | bigint> | undefined;
        if (values != null) {
            // Explicit values flow through full-precision as segment boundaries; the bigint-safe scale
            // positions them. Sort with Number() only for the comparator return value.
            const segments = values.filter((v) => v > d0 && v < d1).sort((a, b) => Number(a) - Number(b));
            ticks = [d0, ...segments, d1];
        } else if (step != null) {
            // A custom interval step is a Number concept (AG-16608 AC #17); narrow a bigint step.
            const numericStep = Number(step);
            const segments: number[] = [];
            for (let i = d0; i < d1; i += numericStep) {
                segments.push(i);
            }
            segments.push(d1);
            ticks = segments;
        } else if (count == null) {
            const segments = scale
                .ticks({
                    nice: [true, true],
                    interval: undefined,
                    tickCount: undefined,
                    minTickCount: 0,
                    maxTickCount: Infinity,
                })
                ?.ticks?.filter((v) => v > d0 && v < d1);
            ticks = segments == null ? undefined : [d0, ...segments, d1];
        } else {
            const segments = count + 1;
            ticks = Array.from({ length: segments + 1 }, (_, i) => (i / segments) * (d1 - d0) + d0);
        }

        if (ticks != null && ticks.length > maxTicks) {
            Logger.warnOnce(
                `the configured segmentation results in more than 1 item per pixel, ignoring. Supply a segmentation configuration that results in larger segments or omit this configuration`
            );
            ticks = undefined;
        }

        ticks ??= [d0, d1];

        return ticks;
    }
}

export class GaugeSegmentationProperties extends BaseProperties {
    @Property
    enabled = false;

    @Property
    readonly interval = new GaugeSegmentationIntervalProperties();

    @Property
    spacing: number = 0;
}
