import type { AgBaseCrossLineLabelOptions, AgCrossLineLabelPosition } from '../../options/agChartOptions';
import { ContinuousScale } from '../../scale/continuousScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { Scale } from '../../scale/scale';
import type { BBox } from '../../scene/bbox';
import type { Group } from '../../scene/group';
import { Logger } from '../../util/logger';
import { predicateWithMessage, stringify } from '../../util/validation';
import { checkDatum } from '../../util/value';
import type { ChartAxisDirection } from '../chartAxisDirection';

export type CrossLineType = 'line' | 'range';

export const MATCHING_CROSSLINE_TYPE = (property: 'value' | 'range') => {
    return property === 'value'
        ? predicateWithMessage(
              (_, ctx) => ctx.target['type'] === 'line',
              (ctx) =>
                  ctx.target['type'] === 'range'
                      ? `crossLine type 'range' to have a 'range' property instead of 'value'`
                      : `crossLine property 'type' to be 'line'`
          )
        : predicateWithMessage(
              (_, ctx) => ctx.target['type'] === 'range',
              (ctx) =>
                  ctx.target.type === 'line'
                      ? `crossLine type 'line' to have a 'value' property instead of 'range'`
                      : `crossLine property 'type' to be 'range'`
          );
};

export const validateCrossLineValues = (
    type: 'line' | 'range',
    value: any,
    range: any,
    scale: Scale<any, number>
): boolean => {
    const lineCrossLine = type === 'line' && value !== undefined;
    const rangeCrossLine = type === 'range' && range !== undefined;

    if (!lineCrossLine && !rangeCrossLine) {
        return true;
    }

    const [start, end] = range ?? [value, undefined];
    const isContinuous = ContinuousScale.is(scale) || OrdinalTimeScale.is(scale);
    const validStart = checkDatum(start, isContinuous) && !isNaN(scale.convert(start));
    const validEnd = checkDatum(end, isContinuous) && !isNaN(scale.convert(end));

    if ((lineCrossLine && validStart) || (rangeCrossLine && validStart && validEnd)) {
        return true;
    }

    const message = [`Expecting crossLine`];

    if (rangeCrossLine) {
        if (!validStart) {
            message.push(`range start ${stringify(start)}`);
        }
        if (!validEnd) {
            message.push(`${validStart ? '' : 'and '}range end ${stringify(end)}`);
        }
    } else {
        message.push(`value ${stringify(start)}`);
    }

    message.push(`to match the axis scale domain.`);

    Logger.warnOnce(message.join(' '));

    return false;
};

export interface CrossLine<LabelType = AgBaseCrossLineLabelOptions> {
    calculateLayout(visible: boolean, reversedAxis?: boolean): BBox | undefined;
    calculatePadding?: (padding: Partial<Record<AgCrossLineLabelPosition, number>>) => void;
    clippedRange: [number, number];
    direction: ChartAxisDirection;
    enabled?: boolean;
    fill?: string;
    fillOpacity?: number;
    gridLength: number;
    group: Group;
    id: string;
    label: LabelType;
    labelGroup: Group;
    lineDash?: number[];
    parallelFlipRotation: number;
    range?: [any, any];
    regularFlipRotation: number;
    scale?: Scale<any, number>;
    sideFlag: 1 | -1;
    stroke?: string;
    strokeOpacity?: number;
    strokeWidth?: number;
    type?: CrossLineType;
    update(visible: boolean): void;
    value?: any;
}
