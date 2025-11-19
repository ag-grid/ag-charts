import { BaseProperties, Logger, Property, type Scale } from 'ag-charts-core';

class GaugeSegmentationIntervalProperties extends BaseProperties {
    @Property
    values?: number[];

    @Property
    step?: number;

    @Property
    count?: number;

    getSegments(scale: Scale<number, number>, maxTicks: number) {
        const { values, step, count } = this;
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
