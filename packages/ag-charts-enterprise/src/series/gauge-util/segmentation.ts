import { BaseProperties, type Logger, Property, type Scale } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

class GaugeSegmentationIntervalProperties extends BaseProperties {
    @Property
    values?: Array<AgNumericValue>;

    @Property
    step?: AgNumericValue;

    @Property
    count?: number;

    getSegments(scale: Scale<AgNumericValue, number>, maxTicks: number, logger: Logger) {
        const { values, step, count } = this;
        // Keep raw endpoints exact for scale.convert(); the Number copies drive only stepping/division.
        const d0 = scale.domainMin ?? Number.NaN;
        const d1 = scale.domainMax ?? Number.NaN;
        const d0n = Number(d0);
        const d1n = Number(d1);

        let ticks: Array<AgNumericValue> | undefined;
        if (values != null) {
            const segments = values.filter((v) => v > d0 && v < d1).sort((a, b) => Number(a) - Number(b));
            ticks = [d0, ...segments, d1];
        } else if (step != null) {
            const numericStep = Number(step);
            const segments: AgNumericValue[] = [];
            for (let i = d0n; i < d1n; i += numericStep) {
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
            ticks = Array.from({ length: segments + 1 }, (_, i) => (i / segments) * (d1n - d0n) + d0n);
        }

        if (ticks != null && ticks.length > maxTicks) {
            logger.warnOnce(
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
